// src/index.ts
import { getPrayerGuidance, formatPrayerGuidance, getSpecificStep, PrayerStep } from './services/prayer';

export interface Env {
  AI: Ai;
}

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

  // Deteksi jadwal sholat (BARU)
  const scheduleKeywords = ['jadwal sholat', 'waktu sholat', 'jam sholat', 'subuh jam', 'dzuhur jam', 'zuhur jam', 'ashar jam', 'maghrib jam', 'isya jam', 'jam berapa subuh', 'jam berapa dzuhur'];
  if (scheduleKeywords.some(k => lowerMsg.includes(k))) {
    return { type: 'prayerSchedule', query: message };
  }

  // Deteksi Quran (sama)
  const quranKeywords = ['ayat', 'surah', 'al-quran', 'alquran', 'qur\'an', 'surat', 'juz', 'tafsir', 'maksud ayat'];
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

          const match = userMessage.match(/surah:(\d+)\s*ayat:(\d+)/i);
          if (match) {
            const ayahData = await getQuranAyah(parseInt(match[1]), parseInt(match[2]));
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
        const stream = await env.AI.run('@cf/qwen/qwen3-30b-a3b-fp8', {
          messages: [
            { role: 'system', content: fullPrompt },
            ...messages
          ],
          stream: true,
          max_tokens: 2048,
        });

        return new Response(stream as any, {
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