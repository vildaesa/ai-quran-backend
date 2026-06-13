// src/index.ts
import { getPrayerGuidance, formatPrayerGuidance, getSpecificStep, PrayerStep } from './services/prayer';

export interface Env {
  AI: any; 
}

// Daftar nama surah resmi lengkap 1 - 114 untuk tampilan header modal yang spesifik dan indah
const QURAN_SURAH_NAMES: { [key: number]: string } = {
  1: "Al-Fatihah", 2: "Al-Baqarah", 3: "Ali 'Imran", 4: "An-Nisa'", 5: "Al-Ma'idah",
  6: "Al-An'am", 7: "Al-A'raf", 8: "Al-Anfal", 9: "At-Taubah", 10: "Yunus",
  11: "Hud", 12: "Yusuf", 13: "Ar-Ra'd", 14: "Ibrahim", 15: "Al-Hijr",
  16: "An-Nahl", 17: "Al-Isra'", 18: "Al-Kahf", 19: "Maryam", 20: "Taha",
  21: "Al-Anbiya'", 22: "Al-Hajj", 23: "Al-Mu'minun", 24: "An-Nur", 25: "Al-Furqan",
  26: "Asy-Syu'ara'", 27: "An-Naml", 28: "Al-Qasas", 29: "Al-Ankabut", 30: "Ar-Rum",
  31: "Luqman", 32: "As-Sajdah", 33: "Al-Ahzab", 34: "Saba'", 35: "Fatir",
  36: "Ya-Sin", 37: "As-Saffat", 38: "Sad", 39: "Az-Zumar", 40: "Ghafir",
  41: "Fussilat", 42: "Asy-Syura", 43: "Az-Zukhruf", 44: "Ad-Dukhan", 45: "Al-Jatsiyah",
  46: "Al-Ahqaf", 47: "Muhammad", 48: "Al-Fath", 49: "Al-Hujurat", 50: "Qaf",
  51: "Adz-Dzariyat", 52: "At-Tur", 53: "An-Najm", 54: "Al-Qamar", 55: "Ar-Rahman",
  56: "Al-Waqi'ah", 57: "Al-Hadid", 58: "Al-Mujadilah", 59: "Al-Hasyr", 60: "Al-Mumtahanah",
  61: "As-Saff", 62: "Al-Jumu'ah", 63: "Al-Munafiqun", 64: "At-Taghabun", 65: "At-Talaq",
  66: "At-Tahrim", 67: "Al-Mulk", 68: "Al-Qalam", 69: "Al-Haqqah", 70: "Al-Ma'arij",
  71: "Nuh", 72: "Al-Jinn", 73: "Al-Muzzammil", 74: "Al-Muddassir", 75: "Al-Qiyamah",
  76: "Al-Insan", 77: "Al-Mursalat", 78: "An-Naba'", 79: "An-Nazi'at", 80: "'Abasa",
  81: "At-Takwir", 82: "Al-Infitar", 83: "Al-Mutaffifin", 84: "Al-Insyiqaq", 85: "Al-Buruj",
  86: "At-Tariq", 87: "Al-A'la", 88: "Al-Ghasyiyah", 89: "Al-Fajr", 90: "Al-Balad",
  91: "Asy-Syams", 92: "Al-Lail", 93: "Ad-Duha", 94: "Al-Insyirah", 95: "At-Tin",
  96: "Al-'Alaq", 97: "Al-Qadr", 98: "Al-Bayyinah", 99: "Al-Zalzalah", 100: "Al-'Adiyat",
  101: "Al-Qari'ah", 102: "At-Takatsur", 103: "Al-'Asr", 104: "Al-Humazah", 105: "Al-Fil",
  106: "Quraisy", 107: "Al-Ma'un", 108: "Al-Kautsar", 109: "Al-Kafirun", 110: "An-Nasr",
  111: "Al-Lahab", 112: "Al-Ikhlas", 113: "Al-Falaq", 114: "An-Nas"
};

const SURAH_MAP: { [key: string]: number } = {
  'al-fatihah': 1, 'fatihah': 1, 'pembukaan': 1,
  'al-baqarah': 2, 'baqarah': 2,
  'ali-imran': 3, 'imran': 3,
  'an-nisa': 4, 'nisa': 4,
  'al-maidah': 5, 'maidah': 5,
  'al-an\'am': 6, 'anam': 6,
  'al-a\'raf': 7, 'araf': 7,
  'al-anfal': 8, 'anfal': 8,
  'at-taubah': 9, 'taubah': 9,
  'yunus': 10, 'hud': 11, 'yusuf': 12, 'ar-ra\'d': 13, 'ibrahim': 14,
  'al-hijr': 15, 'an-nahl': 16, 'al-isra': 17, 'al-kahfi': 18, 'kahfi': 18,
  'maryam': 19, 'taha': 20, 'toha': 20, 'al-anbiya': 21, 'al-hajj': 22,
  'al-mu\'minun': 23, 'an-nur': 24, 'al-furqan': 25, 'asy-syu\'ara': 26,
  'an-naml': 27, 'al-qasas': 28, 'al-ankabut': 29, 'ar-rum': 30,
  'luqman': 31, 'as-sajdah': 32, 'al-ahzab': 33, 'saba': 34, 'fatir': 35,
  'yasin': 36, 'yaasin': 36, 'as-saffat': 37, 'sad': 38, 'az-zumar': 39,
  'ghafir': 40, 'fussilat': 41, 'as-syura': 42, 'az-zukhruf': 43,
  'ad-dukhan': 44, 'al-jatsiyah': 45, 'al-ahqaf': 46, 'muhammad': 47,
  'al-fath': 48, 'al-hujurat': 49, 'qaf': 50, 'adz-dzariyat': 51,
  'at-thur': 52, 'an-najm': 53, 'al-qamar': 54, 'ar-rahman': 55,
  'al-waqi\'ah': 56, 'waqiah': 56, 'al-hadid': 57, 'al-mujadilah': 58,
  'al-hasyr': 59, 'al-mumtahanah': 60, 'as-shaff': 61, 'al-jumu\'ah': 62,
  'al-munafiqun': 63, 'at-taghabun': 64, 'at-thalaq': 65, 'at-tahrim': 66,
  'al-mulk': 67, 'mulk': 67, 'tabarak': 67, 'al-qalam': 68, 'al-haqqah': 69,
  'al-ma\'arij': 70, 'nuh': 71, 'al-jinn': 72, 'al-muzzammil': 73,
  'al-muddassir': 74, 'al-qiyamah': 75, 'al-insan': 76, 'al-mursalat': 77,
  'an-naba': 78, 'an-naziat': 79, 'abasa': 80, 'at-takwir': 81,
  'al-infitar': 82, 'al-mutaffifin': 83, 'al-insyiqaq': 84, 'al-buruj': 85,
  'at-thariq': 86, 'al-a\'la': 87, 'al-ghasyiyah': 88, 'al-fajr': 89,
  'al-balad': 90, 'asy-syams': 91, 'al-lail': 92, 'adh-dhuha': 93,
  'al-insyirah': 94, 'at-tin': 95, 'al-alaq': 96, 'al-qadr': 97,
  'al-bayyinah': 98, 'al-zalzalah': 99, 'al-adiyat': 100, 'al-qari\'ah': 101,
  'at-takatsur': 102, 'al-ashr': 103, 'al-humazah': 104, 'al-fil': 105,
  'quraisy': 106, 'al-ma\'un': 107, 'al-kautsar': 108, 'al-kafirun': 109,
  'an-nashr': 110, 'al-lahab': 111, 'al-ikhlas': 112, 'al-falaq': 113, 'an-nas': 114
};

// ========== FUNGSI AL-QURAN ==========
async function getQuranAyah(surah: number, ayah: number): Promise<any> {
  try {
    const response = await fetch(
      `https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/editions/quran-uthmani,id.kemenag`
    );
    const data = await response.json() as any;

    if (data.code === 200 && data.data) {
      return {
        surah: data.data[0].surah.number,
        surahName: data.data[0].surah.name,
        ayah: ayah,
        arabic: data.data[0].text,
        translation: data.data[1]?.text || 'Terjemahan tidak tersedia'
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function searchQuran(keyword: string): Promise<any> {
  try {
    const encodedKeyword = encodeURIComponent(keyword);
    const response = await fetch(
      `https://api.alquran.cloud/v1/search/${encodedKeyword}/all/id.kemenag`
    );
    const data = await response.json() as any;

    if (data.code === 200 && data.data?.matches) {
      return data.data.matches.slice(0, 3).map((match: any) => ({
        surah: match.surah.number,
        surahName: match.surah.name,
        ayah: match.numberInSurah,
        text: match.text,
        translation: match.translation
      }));
    }
    return [];
  } catch (error) {
    return [];
  }
}

// ========== FUNGSI JADWAL SHOLAT REALTIME ==========
async function getPrayerTimesByCity(city: string, country: string = 'ID', date?: string): Promise<any> {
  const tanggal = date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const url = `https://api.aladhan.com/v1/timingsByCity/${tanggal}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=2`;

  try {
    const res = await fetch(url);
    const data = await res.json() as any;
    if (data.code === 200 && data.data) {
      return {
        date: data.data.date.readable,
        timings: {
          Subuh: data.data.timings.Fajr,
          Dzuhur: data.data.timings.Dhuhr,
          Ashar: data.data.timings.Asr,
          Maghrib: data.data.timings.Maghrib,
          Isya: data.data.timings.Isha
        },
        city: city,
        country: country
      };
    }
    return null;
  } catch (err) {
    console.error('Gagal fetch jadwal sholat:', err);
    return null;
  }
}

// ========== DETEKSI INTENT ==========
function detectIntent(message: string): { type: 'quran' | 'prayer' | 'prayerSchedule' | 'general', query: string } {
  const lowerMsg = message.toLowerCase();

  // Deteksi jadwal sholat
  const scheduleKeywords = ['jadwal sholat', 'waktu sholat', 'jam sholat', 'subuh jam', 'dzuhur jam', 'zuhur jam', 'ashar jam', 'maghrib jam', 'isya jam', 'jam berapa subuh', 'jam berapa dzuhur'];
  if (scheduleKeywords.some(k => lowerMsg.includes(k))) {
    return { type: 'prayerSchedule', query: message };
  }

  // Deteksi Quran
  const quranKeywords = ['ayat', 'surah', 'al-quran', 'alquran', 'qur\'an', 'surat', 'juz', 'tafsir', 'maksud ayat', 'tampilkan', 'buka', 'lihat', 'bacakan', 'open', 'show'];
  if (quranKeywords.some(k => lowerMsg.includes(k))) {
    const match = lowerMsg.match(/(?:surah|surat)\s*(\d+)(?:\s*ayat\s*(\d+))?/i);
    if (match) {
      return { type: 'quran', query: `surah:${match[1]} ayat:${match[2] || '1'}` };
    }
    return { type: 'quran', query: message };
  }

  // Deteksi sholat (tata cara, gerakan, bacaan)
  const prayerKeywords = ['sholat', 'shalat', 'solat', 'subuh', 'dzuhur', 'zuhur', 'ashar', 'maghrib', 'isya', 
                         'tata cara', 'gerakan', 'bacaan', 'niat', 'rukuk', 'sujud', 'tasyahud', 'qunut'];
  if (prayerKeywords.some(k => lowerMsg.includes(k))) {
    return { type: 'prayer', query: message };
  }

  return { type: 'general', query: message };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://vildaesa.github.io',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // ========== ENDPOINT AMBIL PANDUAN SHOLAT ==========
    if (path === '/api/prayer' && request.method === 'GET') {
      const prayerName = url.searchParams.get('name');
      if (!prayerName) {
        return new Response(JSON.stringify({ error: 'Nama sholat required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const guidance = getPrayerGuidance(prayerName);
      if (!guidance) {
        return new Response(JSON.stringify({ error: 'Sholat tidak ditemukan' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      return new Response(JSON.stringify({ prayer: prayerName, ...guidance }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // ========== ENDPOINT JADWAL SHOLAT ==========
    if (path === '/api/prayer-times' && request.method === 'GET') {
      let city = url.searchParams.get('city');
      let country = url.searchParams.get('country');

      if (!city && request.cf) {
        city = request.cf.city || 'Jakarta';
        country = request.cf.country || 'ID';
      } else if (!city) {
        city = 'Jakarta';
        country = 'ID';
      }

      const schedule = await getPrayerTimesByCity(city, country);
      if (!schedule) {
        return new Response(JSON.stringify({ error: 'Gagal mengambil jadwal sholat' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      return new Response(JSON.stringify(schedule), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // ========== ENDPOINT CHAT UTAMA ==========
    if (path === '/api/chat' && request.method === 'POST') {
      try {
        const { messages } = await request.json() as any;
        const userMessage = messages[messages.length - 1]?.content || '';
        const intent = detectIntent(userMessage);

        const cf = request.cf;
        const city = cf?.city || 'Jakarta';
        const country = cf?.country || 'ID';
        const timezone = cf?.timezone || 'Asia/Jakarta';

        const now = new Date();
        const userTime = now.toLocaleTimeString('id-ID', { timeZone: timezone, hour: '2-digit', minute: '2-digit' });
        const userDate = now.toLocaleDateString('id-ID', { timeZone: timezone });

        let contextData = '';
        let systemPrompt = `Kamu adalah asisten Islami yang ramah dan berpengetahuan luas. 
Gunakan bahasa Indonesia yang sopan dan mudah dimengerti. 
Berikan jawaban berdasarkan sumber yang terpercaya (Al-Quran dan Hadits).
PENTING: Jika menulis teks Arab, gunakan karakter Arabic Unicode standar. JANGAN gunakan karakter dari script lain yang terlihat mirip.
Jika kamu tidak yakin dengan ejaan Arab suatu ayat yang panjang, lebih baik berikan terjemahannya saja atau sarankan user untuk merujuk ke Mushaf Al-Quran.

Informasi waktu saat ini:
Lokasi: ${city}, ${country}
Zona waktu: ${timezone}
Tanggal: ${userDate}
Jam: ${userTime}
`;

        // Deteksi apakah user meminta menampilkan surah/ayat secara eksplisit
        let actionToSend: { type: string; surah: number; ayah: number; surahName: string } | null = null;

        if (intent.type === 'quran') {
          const lowerMsg = userMessage.toLowerCase();

          // Pola 1: "tampilkan surah 1 ayat 2", "buka surah 2", "lihat surat 5 ayat 10"
          const match1 = lowerMsg.match(/(?:tampilkan|buka|lihat|bacakan|open|show)\s+(?:surah|surat)\s+(\d+)(?:\s+ayat\s+(\d+))?/i);
          if (match1) {
            const surahNum = parseInt(match1[1]);
            const ayahNum = match1[2] ? parseInt(match1[2]) : 1;
            const surahName = QURAN_SURAH_NAMES[surahNum] || `Surah ${surahNum}`;
            actionToSend = { type: 'openSurah', surah: surahNum, ayah: ayahNum, surahName: surahName };
          }

          // Pola 2: "surah 1 ayat 2" atau "surat 2 ayat 255"
          const match2 = lowerMsg.match(/(?:surah|surat)\s*(\d+)\s+ayat\s*(\d+)/i);
          if (!actionToSend && match2) {
            const surahNum = parseInt(match2[1]);
            const ayahNum = parseInt(match2[2]);
            const surahName = QURAN_SURAH_NAMES[surahNum] || `Surah ${surahNum}`;
            actionToSend = { type: 'openSurah', surah: surahNum, ayah: ayahNum, surahName: surahName };
          }

          // Pola 3: "buka surah Al-Fatihah ayat 1" (pemetaan nama surah populer)
          if (!actionToSend) {
            for (const [surahMapKey, surahNum] of Object.entries(SURAH_MAP)) {
              const regexEscapedName = surahMapKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
              const pattern = new RegExp(`(?:surah|surat)\\s+${regexEscapedName}(?:\\s+ayat\\s+(\\d+))?`, 'i');
              const matchNames = lowerMsg.match(pattern);

              if (matchNames) {
                const ayahNum = matchNames[1] ? parseInt(matchNames[1]) : 1;
                const surahName = QURAN_SURAH_NAMES[surahNum] || `Surah ${surahNum}`;
                actionToSend = { type: 'openSurah', surah: surahNum, ayah: ayahNum, surahName: surahName };
                break;
              }
            }
          }

          // Pola 4: Singkat "surah 1"
          const match4 = lowerMsg.match(/(?:surah|surat)\s*(\d+)/i);
          if (!actionToSend && match4) {
            const surahNum = parseInt(match4[1]);
            const surahName = QURAN_SURAH_NAMES[surahNum] || `Surah ${surahNum}`;
            actionToSend = { type: 'openSurah', surah: surahNum, ayah: 1, surahName: surahName };
          }
        }

        // ========== INTENT JADWAL SHOLAT ==========
        if (intent.type === 'prayerSchedule') {
          systemPrompt += `\n\nKamu sekarang bisa menjawab pertanyaan tentang jadwal sholat berdasarkan data real-time yang diberikan. Gunakan data jadwal sholat di bawah ini untuk menjawab dengan akurat. Jika user menyebutkan kota yang berbeda, beri tahu bahwa data yang tersedia adalah untuk kota ${city}. Sarankan user untuk menggunakan endpoint /api/prayer-times?city=Namakota jika ingin jadwal kota lain.`;

          const schedule = await getPrayerTimesByCity(city, country);
          if (schedule) {
            contextData = `
[INFO JADWAL SHOLAT REAL TIME]
Lokasi: ${schedule.city}, ${schedule.country}
Tanggal: ${schedule.date}
- Subuh  : ${schedule.timings.Subuh}
- Dzuhur : ${schedule.timings.Dzuhur}
- Ashar  : ${schedule.timings.Ashar}
- Maghrib: ${schedule.timings.Maghrib}
- Isya   : ${schedule.timings.Isya}
`;
          } else {
            contextData = `\n[GAGAL MENGAMBIL JADWAL SHOLAT] Coba periksa koneksi atau beri tahu user untuk menyebutkan kota dan negara secara manual.`;
          }
        }
        // ========== INTENT QURAN ==========
        else if (intent.type === 'quran') {
          systemPrompt += `\n\nKamu adalah ahli tafsir Al-Quran. Saat menjawab pertanyaan tentang ayat, 
berikan konteks, asbabun nuzul jika relevan, dan hikmah yang bisa dipetik.`;

          let resolvedSurah = 0;
          let resolvedAyah = 0;

          if (actionToSend) {
            resolvedSurah = actionToSend.surah;
            resolvedAyah = actionToSend.ayah;
          } else {
            const match = userMessage.match(/surah:(\d+)\s*ayat:(\d+)/i);
            if (match) {
              resolvedSurah = parseInt(match[1]);
              resolvedAyah = parseInt(match[2]);
            }
          }

          if (resolvedSurah > 0) {
            const ayahData = await getQuranAyah(resolvedSurah, resolvedAyah);
            if (ayahData) {
              contextData = `\n\n[INFORMASI AYAT DARI AL-QURAN]\nSurat ${ayahData.surahName} ayat ${ayahData.ayah}:\nArab: ${ayahData.arabic}\nTerjemahan: ${ayahData.translation}\n`;
            }
          } else {
            const searchResults = await searchQuran(userMessage);
            if (searchResults.length > 0) {
              contextData = `\n\n[HASIL PENCARIAN AL-QURAN]\n${JSON.stringify(searchResults, null, 2)}\n`;
            }
          }
        }
        // ========== INTENT PANDUAN SHOLAT (TATA CARA) ==========
        else if (intent.type === 'prayer') {
          systemPrompt += `\n\nKamu adalah pembimbing sholat. Berikan panduan yang detail dan akurat 
tentang tata cara sholat, bacaan (arab, latin, terjemahan), dan gerakannya. 
WAJIB menggunakan data panduan sholat yang sudah disediakan.`;

          const prayers = ['subuh', 'dzuhur', 'zuhur', 'ashar', 'maghrib', 'isya'];
          let detectedPrayer = '';
          for (const p of prayers) {
            if (userMessage.toLowerCase().includes(p)) {
              detectedPrayer = p === 'zuhur' ? 'dzuhur' : p;
              break;
            }
          }

          if (detectedPrayer) {
            const formattedGuidance = formatPrayerGuidance(detectedPrayer);
            contextData = `\n\n[DATA PANDUAN SHOLAT ${detectedPrayer.toUpperCase()}]\n${formattedGuidance}\n`;
          } else {
            contextData = `\n\n[INFORMASI UMUM SHOLAT WAJIB]\n1. Subuh: 2 rakaat (Fajar/Dini hari)\n2. Dzuhur: 4 rakaat (Siang hari)\n3. Ashar: 4 rakaat (Sore hari)\n4. Maghrib: 3 rakaat (Terbenam matahari/Awal malam)\n5. Isya: 4 rakaat (Malam hari)\n\nUntuk panduan gerakan dan bacaan lengkap, silakan sebutkan nama sholat yang ingin dipelajari (misal: "tata cara sholat subuh").`;
          }
        }

        const fullPrompt = contextData 
          ? `${systemPrompt}\n\nBerikut adalah data yang bisa kamu gunakan untuk menjawab pertanyaan user:\n${contextData}\n\nSekarang jawab pertanyaan user dengan ramah dan informatif.`
          : systemPrompt;

        // PERBAIKAN: Menggunakan model gemma yang sangat stabil dan dijamin aktif di semua cloudflare
        const aiStream = await env.AI.run('@cf/google/gemma-3-12b-it', {
          messages: [
            { role: 'system', content: fullPrompt },
            ...messages
          ],
          stream: true,
          max_tokens: 2048,
        });

        if (actionToSend) {
          const encoder = new TextEncoder();
          const actionEvent = `event: action\ndata: ${JSON.stringify(actionToSend)}\n\n`;
          
          const introMsg = `Baik, akan saya cari dan tampilkan surah **${actionToSend.surahName}** Ayat **${actionToSend.ayah}** untuk Anda.\n\n*Sedang membuka lembaran Mushaf...*\n\n`;
          const introEvent = `data: ${JSON.stringify({ response: introMsg })}\n\n`;

          const combinedStream = new ReadableStream({
            start(controller) {
              controller.enqueue(encoder.encode(actionEvent));
              controller.enqueue(encoder.encode(introEvent));
              
              const reader = aiStream.getReader();
              function push() {
                reader.read().then(({ done, value }) => {
                  if (done) {
                    controller.close();
                    return;
                  }
                  controller.enqueue(value);
                  push();
                }).catch(err => controller.error(err));
              }
              push();
            }
          });
          
          return new Response(combinedStream, {
            headers: { 'Content-Type': 'text/event-stream', ...corsHeaders }
          });
        }

        return new Response(aiStream as any, {
          headers: { 'Content-Type': 'text/event-stream', ...corsHeaders }
        });

      } catch (error: any) {
        console.error('Error:', error);
        // PERBAIKAN: Mengirim pesan error asli ke frontend agar mudah dianalisis
        const errorMessage = error?.message || error?.toString() || 'Internal server error';
        return new Response(JSON.stringify({ error: errorMessage }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    return new Response('AI Quran & Sholat Assistant is running! 🕌', { headers: corsHeaders });
  }
} satisfies ExportedHandler<Env>;
