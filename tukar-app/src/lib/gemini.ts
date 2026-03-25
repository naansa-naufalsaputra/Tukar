/**
 * gemini.ts — Client untuk memanggil Supabase Edge Function `gemini-proxy`.
 *
 * API Key Gemini TIDAK lagi disimpan di sini atau di .env app.
 * Semua panggilan ke Gemini melalui server (Edge Function) yang aman.
 */
import { supabase } from './supabase';
import { AIExtractedTransaction } from "@/types";
import type { Category, Wallet } from "@/types";
import { Logger } from './logger';

// ─── Helper ──────────────────────────────────────────────────────────────────

/**
 * Panggil Edge Function `gemini-proxy` dengan mode tertentu.
 * Otomatis menyertakan Supabase Auth token sehingga Edge Function
 * bisa di-protect di masa mendatang dengan RLS/JWT check.
 */
async function invokeGeminiProxy(
    prompt: string,
    systemInstruction: string,
    jsonMode: boolean = false
): Promise<string> {
    const { data, error } = await supabase.functions.invoke('gemini-proxy', {
        body: {
            mode: jsonMode ? 'parse' : 'chat',
            prompt,
            systemInstruction,
            jsonMode,
        },
    });

    if (error) throw error;

    // Edge Function mengembalikan { text: "..." }
    const text = data?.text;
    if (typeof text !== 'string' || text.trim().length === 0) {
        throw new Error('Edge Function mengembalikan respons kosong.');
    }

    return text;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

const CHAT_SYSTEM_INSTRUCTION = `Kamu adalah 'Tukar AI', seorang analis keuangan pribadi yang cerdas, ramah, dan solutif. 
Aturan ketat saat menjawab:
1. JAWAB SANGAT SINGKAT dan *to the point* (maksimal 2-3 kalimat pendek).
2. Gunakan gaya bahasa kasual, asyik, dan tambahkan emoji yang relevan (💸, 📈, 💡).
3. Jangan bertele-tele. Jika ditanya tips hemat, berikan 2 poin utama saja.
4. Jangan menggunakan format markdown tebal (**) atau list panjang kecuali diminta.
5. Jika pengguna hanya menyapa ("Halo"), balas dengan sapaan hangat dan tanyakan pengeluaran apa yang mau dicatat hari ini.`;

export const chatWithGemini = async (
    inputText: string,
    financialContext: string = ""
): Promise<string> => {
    try {
        const systemInstruction = financialContext
            ? `${CHAT_SYSTEM_INSTRUCTION}\n\nATURAN KETAT: Jika pengguna minta saran, gunakan DATA KEUANGAN PENGGUNA di bawah ini untuk memberi analisis riil.\n${financialContext}`
            : CHAT_SYSTEM_INSTRUCTION;

        const text = await invokeGeminiProxy(inputText, systemInstruction, false);
        return text;
    } catch (error) {
        Logger.error('Gemini:chat', error);
        return "Maaf, semua sistem AI sedang sibuk. Coba tanya lagi nanti ya!";
    }
};

// ─── Parse Transaksi ──────────────────────────────────────────────────────────

export const parseTransactionWithAI = async (
    prompt: string,
    categories: Category[],
    wallets: Wallet[]
): Promise<AIExtractedTransaction[]> => {
    try {
        // 1. Siapkan konteks data asli milik user agar AI tidak ngawur
        const categoryContext = categories
            .map(c => `{"id":"${c.id}", "name":"${c.name}", "type":"${c.type}"}`)
            .join(', ');
        const walletContext = wallets
            .map(w => `{"id":"${w.id}", "name":"${w.name}"}`)
            .join(', ');

        // 2. System instruction untuk parsing (dikirim ke server, bukan di-hardcode di app)
        const systemInstruction = `
Kamu adalah asisten pencatat keuangan cerdas. 
Tugasmu: Ekstrak informasi dari pesan user menjadi array objek transaksi JSON.

Aturan ketat:
1. Tipe transaksi (transaction_type) hanya boleh "EXPENSE" (pengeluaran), "INCOME" (pemasukan), atau "TRANSFER".
2. Cocokkan kategori dengan ID dari daftar ini: [${categoryContext}]. Jika tidak ada yang cocok persis, pilih ID yang paling mendekati maknanya. UNTUK TRANSFER, category_id HARUS null.
3. Cocokkan dompet sumber (wallet_id) dengan ID dari daftar ini: [${walletContext}]. Jika tidak disebutkan, gunakan dompet pertama sebagai default.
4. Untuk transfer (kata kunci: pindahkan, transfer, geser dana), isi destination_wallet_id dengan ID dompet tujuan dari daftar dompet. Jika bukan transfer, biarkan null.
5. amount wajib berupa angka (number) tanpa titik/koma. Kata seperti "25rb" = 25000, "cepek" = 100000.

Output harus berupa Array JSON murni tanpa markdown, dengan format persis seperti ini:
[
  {
    "amount": 25000,
    "notes": "Makan siang di burjo",
    "transaction_type": "EXPENSE",
    "category_id": "uuid-kategori-disini",
    "wallet_id": "uuid-dompet-disini",
    "destination_wallet_id": null
  }
]
        `.trim();

        // 3. Panggil Edge Function dengan jsonMode = true
        const responseText = await invokeGeminiProxy(
            `Pesan User: "${prompt}"\n\nEkstrak ke JSON sekarang:`,
            systemInstruction,
            true // jsonMode
        );

        // 4. Parse JSON hasil AI
        try {
            return JSON.parse(responseText);
        } catch (parseError) {
            Logger.error('Gemini:parse', responseText);
            throw new Error('AI mengembalikan format yang tidak valid. Coba lagi.');
        }

    } catch (error) {
        Logger.error('Gemini:parseTransaction', error);
        throw new Error("Gagal memproses pesan dengan AI. Coba lagi dengan bahasa yang lebih jelas.");
    }
};
