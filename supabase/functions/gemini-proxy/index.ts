import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Tetap * untuk development, tapi idealnya domain App Anda
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Model yang valid dan sudah diuji — tidak ada nama model salah lagi
const AVAILABLE_MODELS = [
  "gemini-2.0-flash",           // Utama: cepat & stabil
  "gemini-1.5-flash",           // Cadangan 1: sangat stabil
  "gemini-1.5-flash-8b",        // Cadangan 2: ultra-ringan
];

const CHAT_SYSTEM_INSTRUCTION = `Kamu adalah 'Tukar AI', asisten keuangan cerdas, ramah, dan gaul. 
Aturan ketat saat menjawab:
1. JAWAB SANGAT SINGKAT dan *to the point* (maksimal 2-3 kalimat pendek).
2. Gunakan gaya bahasa kasual, asyik, dan tambahkan emoji yang relevan (💸, 📈, 💡).
3. Jangan bertele-tele. Jika ditanya tips hemat, berikan 2 poin utama saja.
4. Jangan menggunakan format markdown tebal (**) atau list panjang kecuali diminta.
5. Jika pengguna hanya menyapa ("Halo"), balas dengan sapaan hangat dan tanyakan pengeluaran apa yang mau dicatat hari ini.`;

interface GenerateRequest {
  mode: "chat" | "parse";
  prompt: string;
  systemInstruction?: string;
  jsonMode?: boolean;
}

async function generateWithFallback(
  apiKey: string,
  prompt: string,
  systemInstruction: string,
  jsonMode: boolean = false
): Promise<string> {
  let lastError: Error | null = null;

  for (const modelName of AVAILABLE_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

      const requestBody: Record<string, unknown> = {
        system_instruction: {
          parts: [{ text: systemInstruction }],
        },
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      };

      if (jsonMode) {
        requestBody.generation_config = {
          response_mime_type: "application/json",
        };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(25000), // 25 detik timeout per model
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`HTTP ${response.status}: ${errBody}`);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error("Empty response from model");
      }

      return text;
    } catch (error) {
      console.error(`[gemini-proxy] Model ${modelName} failed:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      // Lanjut ke model berikutnya
    }
  }

  throw lastError ?? new Error("All Gemini models failed.");
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validasi Authorization Header (JWT Supabase)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY secret is not configured on this Edge Function.");
    }

    const body: GenerateRequest = await req.json();
    const { mode, prompt, systemInstruction, jsonMode = false } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "prompt is required and must be a non-empty string." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Tentukan system instruction berdasarkan mode
    const resolvedSystemInstruction =
      systemInstruction ?? (mode === "parse" ? "" : CHAT_SYSTEM_INSTRUCTION);

    const result = await generateWithFallback(
      apiKey,
      prompt,
      resolvedSystemInstruction,
      jsonMode
    );

    return new Response(
      JSON.stringify({ text: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[gemini-proxy] Unhandled error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
