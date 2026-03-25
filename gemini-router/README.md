# Gemini Router (Safe Failover)

Router lokal untuk failover antara Google OAuth dan beberapa Gemini API key dengan fokus keamanan akun.

## Fitur

- Rotasi provider berbasis health (`429`, `5xx`, timeout)
- Cooldown otomatis per provider
- Prioritas provider via `PROVIDER_ORDER` (contoh: OAuth dulu, API key jadi backup)
- Rotasi/fallback model via `MODEL_ORDER` (contoh: Pro -> Flash)
- Retry + exponential backoff + jitter
- Redaksi token/API key di log
- Endpoint health tanpa membocorkan secret

## Setup

1. Salin env template:

```bash
cp .env.example .env
```

2. Isi token di `.env`:

- `PROVIDER_OAUTH_MAIN_TOKEN` = access token OAuth Google
- `PROVIDER_KEY_PRIMARY_TOKEN` = API key Gemini
- `PROVIDER_KEY_SECONDARY_TOKEN` = API key Gemini cadangan

Set default prioritas aman:

- `PROVIDER_ORDER=oauth-main,key-primary,key-secondary`
- `MODEL_ORDER=gemini-3.1-pro-preview,gemini-3-flash-preview,gemini-2.5-flash`

3. Jalankan:

```bash
npm start
```

Atau auto-start (PowerShell, cek dulu kalau belum running):

```powershell
powershell -ExecutionPolicy Bypass -File .\start-router.ps1
```

Sync credential otomatis (OAuth + API key pool -> .env):

```powershell
powershell -ExecutionPolicy Bypass -File .\sync-credentials.ps1
```

## Endpoint

- `GET /health` → status provider pool
- `POST /generate` → proxy ke `generateContent`
- `POST /opencode/generate` → adapter format `messages` ala OpenAI/OpenCode
- `POST /v1beta/models/{model}:generateContent` → kompatibel style endpoint Gemini

## Dashboard Monitoring

- Buka `gemini-router/dashboard.html` di browser.
- Dashboard akan polling `http://127.0.0.1:8787/health` untuk status provider, attempts/failures, cooldown, dan urutan model.

Contoh request:

```bash
curl -X POST "http://127.0.0.1:8787/generate" \
  -H "content-type: application/json" \
  -d '{
    "contents": [
      {
        "role": "user",
        "parts": [{"text": "Say hi"}]
      }
    ]
  }'
```

## Catatan Keamanan

- Jangan commit file `.env`.
- Token tidak pernah ditulis utuh ke log (auto-redacted).
- Jalankan router di `127.0.0.1` (localhost only) untuk meminimalkan eksposur.
- Gunakan rotasi ini untuk reliability/failover operasional, bukan untuk bypass kebijakan kuota.

## Otomatis aktif atau tidak?

- Router **aktif otomatis hanya jika prosesnya hidup**.
- Setelah `start-router.ps1` dijalankan, script akan skip kalau router sudah running di port yang sama.
- Untuk full-auto saat buka terminal, kamu bisa tambahkan call ke `start-router.ps1` di profile PowerShell (`$PROFILE`).

## Catatan Penting soal ToS

- Setup ini untuk reliability/failover operasional, **bukan** untuk bypass limit atau kebijakan provider.
- Jika akun OAuth kena 403 ToS, route OAuth akan gagal dan router otomatis pindah ke API key yang sehat.
