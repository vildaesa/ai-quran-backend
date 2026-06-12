// src/index.ts
import { getPrayerGuidance, formatPrayerGuidance, getSpecificStep, PrayerStep } from './services/prayer';

export interface Env {
  AI: any; // Menggunakan any agar fleksibel sesuai runtime Cloudflare Workers Anda
}

// Map nama-nama surah populer dalam Bahasa Indonesia ke nomor surahnya untuk memperkaya deteksi
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
  'yunus': 10,
  'hud': 11,
  'yusuf': 12,
  'ar-ra\'d': 13, 'rad': 13,
  'ibrahim': 14,
  'al-hijr': 15, 'hijr': 15,
  'an-nahl': 16, 'nahl': 16,
  'al-isra': 17, 'isra': 17,
  'al-kahfi': 18, 'kahfi': 18,
  'maryam': 19,
  'taha': 20, 'toha': 20,
  'al-anbiya': 21, 'anbiya': 21,
  'al-hajj': 22, 'hajj': 22,
  'al-mu\'minun': 23, 'muminun': 23,
  'an-nur': 24, 'nur': 24,
  'al-furqan': 25, 'furqan': 25,
  'asy-syu\'ara': 26, 'syuara': 26,
  'an-naml': 27, 'naml': 27,
  'al-qasas': 28, 'qasas': 28,
  'al-ankabut': 29, 'ankabut': 29,
  'ar-rum': 30, 'rum': 30,
  'luqman': 31,
  'as-sajdah': 32, 'sajdah': 32,
  'al-ahzab': 33, 'ahzab': 33,
  'saba': 34,
  'fatir': 35,
  'yasin': 36, 'yaasin': 36,
  'as-saffat': 37, 'saffat': 37,
  'sad': 38,
  'az-zumar': 39, 'zumar': 39,
  'ghafir': 40, 'al-mu\'min': 40,
  'fussilat': 41,
  'as-syura': 42, 'syura': 42,
  'az-zukhruf': 43, 'zukhruf': 43,
  'ad-dukhan': 44, 'dukhan': 44,
  'al-jatsiyah': 45, 'jatsiyah': 45,
  'al-ahqaf': 46, 'ahqaf': 46,
  'mohammad': 47, 'muhammad': 47,
  'al-fath': 48, 'fath': 48,
  'al-hujurat': 49, 'hujurat': 49,
  'qaf': 50,
  'adz-dzariyat': 51, 'dzariyat': 51,
  'at-thur': 52, 'thur': 52,
  'an-najm': 53, 'najm': 53,
  'al-qamar': 54, 'qamar': 54,
  'ar-rahman': 55, 'rahman': 55,
  'al-waqi\'ah': 56, 'waqiah': 56,
  'al-hadid': 57, 'hadid': 57,
  'al-mujadilah': 58, 'mujadilah': 58,
  'al-hasyr': 59, 'hasyr': 59,
  'al-mumtahanah': 60, 'mumtahanah': 60,
  'as-shaff': 61, 'shaff': 61,
  'al-jumu\'ah': 62, 'jumuah': 62, 'jumat': 62,
  'al-munafiqun': 63, 'munafiqun': 63,
  'at-taghabun': 64, 'taghabun': 64,
  'at-thalaq': 65, 'thalaq': 65,
  'at-tahrim': 66, 'tahrim': 66,
  'al-mulk': 67, 'mulk': 67, 'tabarak': 67,
  'al-qalam': 68, 'qalam': 68,
  'al-haqqah': 69, 'haqqah': 69,
  'al-ma\'arij': 70, 'maarij': 70,
  'nuh': 71,
  'al-jinn': 72, 'jinn': 72,
  'al-muzzammil': 73, 'muzzammil': 73,
  'al-muddassir': 74, 'muddassir': 74,
  'al-qiyamah': 75, 'qiyamah': 75,
  'al-insan': 76, 'insan': 76,
  'al-mursalat': 77, 'mursalat': 77,
  'an-naba': 78, 'naba': 78,
  'an-naziat': 79, 'naziat': 79,
  'abasa': 80,
  'at-takwir': 81, 'takwir': 81,
  'al-infitar': 82, 'infitar': 82,
  'al-mutaffifin': 83, 'mutaffifin': 83,
  'al-insyiqaq': 84, 'insyiqaq': 84,
  'al-buruj': 85, 'buruj': 85,
  'at-thariq': 86, 'thariq': 86,
  'al-a\'la': 87, 'ala': 87,
  'al-ghasyiyah': 88, 'ghasyiyah': 88,
  'al-fajr': 89, 'fajr': 89,
  'al-balad': 90, 'balad': 90,
  'asy-syams': 91, 'syams': 91,
  'al-lail': 92, 'lail': 92,
  'adh-dhuha': 93, 'dhuha': 93,
  'al-insyirah': 94, 'insyirah': 94, 'alam-nasyrah': 94,
  'at-tin': 95, 'tin': 95,
  'al-alaq': 96, 'alaq': 96,
  'al-qadr': 97, 'qadr': 97,
  'al-bayyinah': 98, 'bayyinah': 98,
  'al-zalzalah': 99, 'zalzalah': 99,
  'al-adiyat': 100, 'adiyat': 100,
  'al-qari\'ah': 101, 'qariah': 101,
  'at-takatsur': 102, 'takatsur': 102,
  'al-ashr': 103, 'ashr': 103,
  'al-humazah': 104, 'humazah': 104,
  'al-fil': 105, 'fil': 105,
  'quraisy': 106,
  'al-ma\'un': 107, 'maun': 107,
  'al-kautsar': 108, 'kautsar': 108,
  'al-kafirun': 109, 'kafirun': 109,
  'an-nashr': 110, 'nashr': 110,
  'al-lahab': 111, 'lahab': 111,
  'al-ikhlas': 112, 'ikhlas': 112,
  'al-falaq': 113, 'falaq': 113,
  'an-nas': 114, 'nas': 114
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

      // Jika tidak dikirim dari frontend, gunakan data dari request.cf
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

        // Ambil informasi lokasi & waktu dari request.cf (jika ada)
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
PENTING: Jika menulis teks Arab, gunakan karakter Arabic Unicode standar. JANGAN gunakan karakter dari script lain (seperti Cyrillic) yang terlihat mirip.
Jika kamu tidak yakin dengan ejaan Arab suatu ayat yang panjang, lebih baik berikan terjemahannya saja atau sarankan user untuk merujuk ke Mushaf Al-Quran.

Informasi waktu saat ini:
Lokasi: ${city}, ${country}
Zona waktu: ${timezone}
Tanggal: ${userDate}
Jam: ${userTime}
`;

        // Deteksi apakah user meminta menampilkan surah/ayat secara eksplisit
        let actionToSend: { type: string; surah: number; ayah: number } | null = null;

        if (intent.type === 'quran') {
          const lowerMsg = userMessage.toLowerCase();

          // Pola 1: "tampilkan surah 1 ayat 2", "buka surah 2", "lihat surat 5 ayat 10"
          const match1 = lowerMsg.match(/(?:tampilkan|buka|lihat|bacakan|open|show)\s+(?:surah|surat)\s+(\d+)(?:\s+ayat\s+(\d+))?/i);
          if (match1) {
            const surahNum = parseInt(match1[1]);
            const ayahNum = match1[2] ? parseInt(match1[2]) : 1;
            actionToSend = { type: 'openSurah', surah: surahNum, ayah: ayahNum };
          }

          // Pola 2: "surah 1 ayat 2" atau "surat 2 ayat 255"
          const match2 = lowerMsg.match(/(?:surah|surat)\s*(\d+)\s+ayat\s*(\d+)/i);
          if (!actionToSend && match2) {
            actionToSend = { type: 'openSurah', surah: parseInt(match2[1]), ayah: parseInt(match2[2]) };
          }

          // Pola 3: "buka surah Al-Fatihah ayat 1" (pemetaan nama surah populer)
          if (!actionToSend) {
            // Mencocokkan nama surah dari daftar SURAH_MAP
            for (const [surahName, surahNum] of Object.entries(SURAH_MAP)) {
              // Contoh regex: /surah al-fatihah( ayat (\d+))?/i
              const regexEscapedName = surahName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
              const pattern = new RegExp(`(?:surah|surat)\\s+${regexEscapedName}(?:\\s+ayat\\s+(\\d+))?`, 'i');
              const matchNames = lowerMsg.match(pattern);

              if (matchNames) {
                const ayahNum = matchNames[1] ? parseInt(matchNames[1]) : 1;
                actionToSend = { type: 'openSurah', surah: surahNum, ayah: ayahNum };
                break;
              }
            }
          }

          // Pola 4: Singkat "surah 1"
          const match4 = lowerMsg.match(/(?:surah|surat)\s*(\d+)/i);
          if (!actionToSend && match4) {
            actionToSend = { type: 'openSurah', surah: parseInt(match4[1]), ayah: 1 };
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

          // Jika terdeteksi surah & ayat dari parsing manual atau action
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

        // Gabungkan prompt
        const fullPrompt = contextData 
          ? `${systemPrompt}\n\nBerikut adalah data yang bisa kamu gunakan untuk menjawab pertanyaan user:\n${contextData}\n\nSekarang jawab pertanyaan user dengan ramah dan informatif.`
          : systemPrompt;

        // Panggil Workers AI
        const aiStream = await env.AI.run('@cf/google/gemma-3-12b-it', {
          messages: [
            { role: 'system', content: fullPrompt },
            ...messages
          ],
          stream: true,
          max_tokens: 2048,
        });

        // ========== JIKA ADA ACTION YANG HARUS DIKIRIM KE FRONTEND ==========
        if (actionToSend) {
          const encoder = new TextEncoder();
          const actionEvent = `event: action\ndata: ${JSON.stringify(actionToSend)}\n\n`;
          
          const combinedStream = new ReadableStream({
            start(controller) {
              // Kirim event action terlebih dahulu di bagian paling awal stream
              controller.enqueue(encoder.encode(actionEvent));
              
              // Teruskan stream dari AI
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

        // Jika tidak ada action, kirim stream biasa
        return new Response(aiStream as any, {
          headers: { 'Content-Type': 'text/event-stream', ...corsHeaders }
        });

      } catch (error) {
        console.error('Error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    return new Response('AI Quran & Sholat Assistant is running! 🕌', { headers: corsHeaders });
  }
} satisfies ExportedHandler<Env>;
