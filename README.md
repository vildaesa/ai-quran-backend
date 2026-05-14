# AI Quran & Sholat Backend 🕌

Backend API untuk asisten Islami cerdas yang dibangun menggunakan **Cloudflare Workers** dan **Workers AI**.

## Fitur Utama
- **Intent Detection**: Mendeteksi secara otomatis apakah user bertanya tentang Al-Quran, panduan Sholat, atau pertanyaan umum.
- **Quran Integration**: Mengambil data ayat dan terjemahan langsung dari API Al-Quran Cloud.
- **Prayer Guidance**: Menyediakan panduan tata cara sholat lengkap (bacaan Arab, Latin, dan terjemahan).
- **Workers AI (Llama 3)**: Menggunakan model Llama 3.2 untuk memberikan jawaban yang luwes dan informatif dalam Bahasa Indonesia.
- **Streaming Response**: Mendukung Server-Sent Events (SSE) untuk efek mengetik real-time di frontend.

## Tech Stack
- **Runtime**: Cloudflare Workers
- **Language**: TypeScript
- **Framework**: Standard Fetch API (dengan itty-router untuk manajemen rute)
- **AI Model**: `@cf/google/gemma-4-26b-a4b-it`

## Pengembangan Lokal

1. Instalasi dependensi:
   ```bash
   npm install
   ```

2. Jalankan server dev:
   ```bash
   npx wrangler dev
   ```
   Backend akan berjalan di `http://localhost:8787`.

## Deployment
Deploy ke Cloudflare:
```bash
npx wrangler deploy
```

## Konfigurasi Binding (wrangler.jsonc)
Pastikan binding AI sudah dikonfigurasi:
```json
"ai": {
  "binding": "AI",
  "remote": true
}
```
