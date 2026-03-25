# 📋 Session Briefing — Tukar App

> **Cara pakai:** Copy-paste seluruh isi file ini di awal setiap sesi baru dengan Antigravity.
> Update bagian `PROGRESS` dan `FOKUS SESI INI` setiap kali mulai sesi baru.

---

## 🚀 Konteks Project

**Nama App:** Tukar — Aplikasi manajemen keuangan pribadi bertenaga AI

**Stack:**

- React Native (Expo) + NativeWind v4 (styling dengan Tailwind class)
- Zustand + AsyncStorage (state management + persistence)
- Supabase (PostgreSQL + Auth + Realtime)
- Gemini 1.5 Flash (AI parsing transaksi via `src/lib/gemini.ts`)
- @react-navigation v6 (navigasi)
- lucide-react-native (icons)

**Lokasi Project:** `d:/Coding/tukar/tukar-app/`

---

## 🏗️ Arsitektur Kunci

```
src/lib/supabase.ts     ← Supabase client (auth + DB)
src/lib/gemini.ts       ← Gemini AI: parseTransactionWithAI(), chatWithGemini()
src/store/useStore.ts   ← Zustand store: semua state + fungsi utama
src/navigation/
  RootNavigator.tsx     ← Auth guard + semua route
  BottomTabs.tsx        ← Tab bar navigasi bawah
src/screens/            ← 13 halaman
src/components/         ← TransactionModal, TransactionItem, dll
```

---

## ✅ Fitur yang Sudah Selesai

- [x] Auth (Login + Signup via Supabase)
- [x] HomeScreen (ringkasan saldo, wallet cards, recent transactions)
- [x] ActivityScreen (riwayat transaksi dengan filter)
- [x] AddTransactionScreen (form tambah transaksi manual)
- [x] ChatScreen — Dark mode, ChatGPT-style UI
- [x] Struk Mini — AI auto-parse + auto-save + receipt card di chat
- [x] ManageCategoriesScreen (CRUD kategori dengan ikon + warna)
- [x] AddCategoryScreen (form buat kategori baru)
- [x] ManageWalletsScreen + AddWalletScreen
- [x] SubscriptionsScreen (langganan bulanan)
- [x] WishlistScreen (goals/tabungan)
- [x] ProfileScreen (tema, logout)
- [x] Dark/Light mode toggle

---

## 🚧 In Progress / Known Issues

- [ ] Lint warning: `AddCategoryScreen` module not found (kemungkinan issue TS caching)
- [ ] TransactionModal (legacy) masih ada di components tapi sudah tidak dipakai di ChatScreen
- [ ] AI parsing belum handle kasus "transfer antar dompet" dengan sempurna

---

## 🎯 Fokus Sesi Ini

> **GANTI BAGIAN INI** di setiap sesi baru:

```
Sesi: [tanggal + deskripsi singkat]
Tujuan: [apa yang ingin dicapai]
File yang akan disentuh: [nama file]
Constraint: [hal yang tidak boleh diubah]
```

---

## 📐 Aturan Penting

1. **Jangan hapus `TransactionModal.tsx`** — masih dipakai di beberapa tempat
2. **NativeWind class harus valid** — cek di tailwind.config.ts sebelum pakai class baru
3. **Semua query DB harus lewat Zustand** — jangan direct Supabase dari screen
4. **`addTransaction()` wajib terima `userId`** — fungsinya require parameter ini
5. **Tema:** Dark mode by default (`currentTheme: 'dark'` di store)
6. **Reanimated v4 (Software Mansion):**
   - **MANDATORY:** Gunakan package `react-native-worklets` (Margelo v1.x/-core TIDAK compatible).
   - **Babel plugin:** Harus di setting ke `"react-native-worklets/plugin"`.
   - **PENTING:** Hapus `"react-native-reanimated/plugin"` dari `babel.config.js` karena di v4 itu fungsinya sudah digantikan.
   - **Cache:** Setiap ganti config Babel, wajib run `npx expo start -c --clear`.

- **Development Client:** Sesi ini pindah ke Expo Development Client karena Reanimated v4 tidak compatible dengan native runtime Expo Go standar.

---

## 🔑 Environment Variables (`.env`)

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GEMINI_API_KEY=
```
