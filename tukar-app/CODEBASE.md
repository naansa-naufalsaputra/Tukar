# CODEBASE.md — Tukar App Dependency Map

> File ini diperuntukkan untuk AI agar tahu dampak edit sebelum modifikasi file apapun.
> Update file ini setiap kali menambah file baru atau mengubah dependency antar modul.

---

## 📐 Arsitektur Singkat

```
src/
├── lib/            # External clients (Supabase, Gemini AI)
├── store/          # Global state (Zustand)
├── navigation/     # Route definitions
├── screens/        # UI halaman utama
└── components/     # UI reusable
```

---

## 🗺️ Dependency Graph

### `src/lib/supabase.ts`

- **Diimport oleh:** SEMUA screens, useStore.ts, TransactionModal.tsx, ChatScreen.tsx
- **Ketergantungan:** `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (dari `.env`)
- ⚠️ **Jika diubah:** Test auth, data fetching, dan realtime subscription di seluruh app.

### `src/lib/gemini.ts`

- **Fungsi utama:** `parseTransactionWithAI()`, `chatWithGemini()`
- **Diimport oleh:** `src/store/useStore.ts`
- **Ketergantungan:** `EXPO_PUBLIC_GEMINI_API_KEY` (dari `.env`)
- ⚠️ **Jika diubah:** Test `sendMsgToAI()` di `useStore.ts` + ChatScreen flow.

---

### `src/store/useStore.ts`

- **Fungsi utama:** State management seluruh app (wallets, transactions, categories, chatHistory, AI)
- **Diimport oleh:** SEMUA screens + TransactionModal.tsx
- **Interface yang dieksport:** `ChatMessage`, `Transaction`, `Wallet`, `Category`, `Subscription`, `Goal`
- **Fungsi kunci:**
  - `fetchInitialData(userId)` — dipanggil oleh `RootNavigator.tsx`
  - `addTransaction()` — dipanggil oleh `TransactionModal`, `sendMsgToAI`
  - `sendMsgToAI(text, userId)` — dipanggil oleh `ChatScreen.tsx`
  - `parseAIInput()` — legacy, masih tersedia tapi `sendMsgToAI` lebih dianjurkan
- ⚠️ **Jika mengubah interface:** Update semua consumer (screens yang destructure state).

---

### `src/navigation/RootNavigator.tsx`

- **Peran:** Entry point navigasi, auth guard, inisialisasi data
- **Diimport oleh:** App root (app entry point)
- **Screens yang didaftarkan:** MainTabs, ChatScreen, Wishlist, AddTransactionScreen, Subscriptions, ManageCategoriesScreen, ManageWalletsScreen, AddCategoryScreen, AddWalletScreen, LoginScreen, SignupScreen
- ⚠️ **Jika tambah screen baru:** WAJIB daftarkan di sini.

### `src/navigation/BottomTabs.tsx`

- **Peran:** Tab navigasi bawah
- **Tabs:** Home, Activity, Chat, Profile (dan lainnya)
- ⚠️ **Jika tambah tab baru:** Update juga di sini.

---

### `src/screens/` — Inventory Screens

| File | Fitur Utama | Akses Store |
|------|-------------|-------------|
| `HomeScreen.tsx` | Dashboard, ringkasan keuangan | wallets, transactions, goals |
| `ActivityScreen.tsx` | Riwayat transaksi | transactions, categories |
| `ChatScreen.tsx` | AI Chat + Struk Mini | chatHistory, sendMsgToAI |
| `AddTransactionScreen.tsx` | Form tambah transaksi | addTransaction, wallets, categories |
| `ProfileScreen.tsx` | Setting profil, tema | toggleTheme, clearChatHistory |
| `ManageCategoriesScreen.tsx` | Kelola kategori | categories, addCategory, deleteCategory |
| `ManageWalletsScreen.tsx` | Kelola dompet | wallets, addWallet |
| `AddCategoryScreen.tsx` | Form buat kategori baru | addCategory |
| `AddWalletScreen.tsx` | Form buat dompet baru | addWallet |
| `SubscriptionsScreen.tsx` | Langganan bulanan | subscriptions, addSubscription, paySubscription |
| `WishlistScreen.tsx` | Wishlist/goals | goals, addGoal, updateGoal, deleteGoal |
| `LoginScreen.tsx` | Auth login | supabase.auth langsung |
| `SignupScreen.tsx` | Auth register | supabase.auth langsung |

---

### `src/components/` — Inventory Komponen Reusable

| File | Dipakai di | Props Kunci |
|------|------------|-------------|
| `TransactionModal.tsx` | (Legacy — ChatScreen dulu) | visible, onClose, extractedData |
| `TransactionItem.tsx` | ActivityScreen | title, amount, type, category |
| `AddTransactionModal.tsx` | HomeScreen? | - |
| `AddWalletModal.tsx` | ManageWalletsScreen | - |
| `AddGoalModal.tsx` | WishlistScreen | - |
| `Typography.tsx` | Semua screens | variant, weight |
| `WalletCard.tsx` | HomeScreen | wallet data |

---

## 🔗 Critical Dependency Chains

```
.env
  └── supabase.ts ──────────────────────────────┐
  └── gemini.ts ──► useStore.ts (sendMsgToAI)   │
                          │                       │
                    semua screens ◄───────────────┘
                          │
                    RootNavigator.tsx (entry)
```

---

## 🚨 Aturan untuk AI — Sebelum Edit File

| File yang Diedit | File yang WAJIB Dicek |
|------------------|-----------------------|
| `useStore.ts` | Semua screens yang pakai fungsi yang diubah |
| `gemini.ts` | `useStore.ts` → `sendMsgToAI()` |
| `supabase.ts` | Auth flow + semua query Supabase |
| `RootNavigator.tsx` | BottomTabs.tsx + semua screen yang didaftarkan |
| Interface `ChatMessage` | `ChatScreen.tsx` + `useStore.ts` |
| Interface `Transaction` | `ActivityScreen.tsx`, `HomeScreen.tsx`, `AddTransactionScreen.tsx` |

---

## 📦 Tech Stack

| Layer | Library | Versi |
|-------|---------|-------|
| Framework | React Native (Expo) | - |
| Navigation | @react-navigation | v6 |
| State | Zustand + AsyncStorage persist | - |
| Styling | NativeWind v4 | - |
| Backend | Supabase (DB + Auth + Realtime) | - |
| AI | Google Gemini 1.5 Flash | via @google/generative-ai |
| Icons | lucide-react-native | - |
| Validation | Zod | - |

---

*Last updated: 2026-02-27 — Update file ini setiap kali menambah screen/komponen baru!*
