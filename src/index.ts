// src/index.ts
import { getPrayerGuidance, formatPrayerGuidance, getSpecificStep, PrayerStep } from './services/prayer';

export interface Env {
  AI: Ai;
}

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

function detectIntent(message: string): { type: 'quran' | 'prayer' | 'general', query: string } {
  const lowerMsg = message.toLowerCase();
  
  // Deteksi Quran
  const quranKeywords = ['ayat', 'surah', 'al-quran', 'alquran', 'qur\'an', 'surat', 'juz', 'tafsir', 'maksud ayat'];
  if (quranKeywords.some(k => lowerMsg.includes(k))) {
    const match = lowerMsg.match(/(?:surah|surat)\s*(\d+)(?:\s*ayat\s*(\d+))?/i);
    if (match) {
      return { type: 'quran', query: `surah:${match[1]} ayat:${match[2] || '1'}` };
    }
    return { type: 'quran', query: message };
  }
  
  // Deteksi Sholat
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
    
    // Endpoint untuk ambil data sholat langsung (optional)
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
    
    // Endpoint chat utama
    if (path === '/api/chat' && request.method === 'POST') {
      try {
        const { messages } = await request.json() as any;
        const userMessage = messages[messages.length - 1]?.content || '';
        const intent = detectIntent(userMessage);
        
        let contextData = '';
        let systemPrompt = `Kamu adalah asisten Islami yang ramah dan berpengetahuan luas. 
Gunakan bahasa Indonesia yang sopan dan mudah dimengerti. 
Berikan jawaban berdasarkan sumber yang terpercaya (Al-Quran dan Hadits).
PENTING: Jika menulis teks Arab, gunakan karakter Arabic Unicode standar. JANGAN gunakan karakter dari script lain (seperti Cyrillic) yang terlihat mirip.
Jika kamu tidak yakin dengan ejaan Arab suatu ayat yang panjang, lebih baik berikan terjemahannya saja atau sarankan user untuk merujuk ke Mushaf Al-Quran.`;
        
        // Handle Quran intent
        if (intent.type === 'quran') {
          systemPrompt += `\n\nKamu adalah ahli tafsir Al-Quran. Saat menjawab pertanyaan tentang ayat, 
berikan konteks, asbabun nuzul jika relevan, dan hikmah yang bisa dipetik.`;
          
          // Cek apakah ada surah/ayat spesifik
          const match = userMessage.match(/surah:(\d+)\s*ayat:(\d+)/i);
          if (match) {
            const ayahData = await getQuranAyah(parseInt(match[1]), parseInt(match[2]));
            if (ayahData) {
              contextData = `\n\n[INFORMASI AYAT DARI AL-QURAN]\nSurat ${ayahData.surahName} ayat ${ayahData.ayah}:\nArab: ${ayahData.arabic}\nTerjemahan: ${ayahData.translation}\n`;
            }
          } else {
            // Search keyword
            const searchResults = await searchQuran(userMessage);
            if (searchResults.length > 0) {
              contextData = `\n\n[HASIL PENCARIAN AL-QURAN]\n${JSON.stringify(searchResults, null, 2)}\n`;
            }
          }
        }
        
        // Handle Prayer intent
        if (intent.type === 'prayer') {
          systemPrompt += `\n\nKamu adalah pembimbing sholat. Berikan panduan yang detail dan akurat 
tentang tata cara sholat, bacaan (arab, latin, terjemahan), dan gerakannya. 
WAJIB menggunakan data panduan sholat yang sudah disediakan. Jika user bertanya tentang waktu sholat, 
jawablah berdasarkan pengetahuan umum yang akurat: Subuh (Fajar), Dzuhur (Tengah hari), Ashar (Sore), 
Maghrib (Terbenam matahari), Isya (Malam).`;
          
          // Deteksi jenis sholat yang ditanyakan
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
            // Jika ga spesifik, kasih info semua sholat
            contextData = `\n\n[INFORMASI UMUM SHOLAT WAJIB]\n1. Subuh: 2 rakaat (Fajar/Dini hari)\n2. Dzuhur: 4 rakaat (Siang hari)\n3. Ashar: 4 rakaat (Sore hari)\n4. Maghrib: 3 rakaat (Terbenam matahari/Awal malam)\n5. Isya: 4 rakaat (Malam hari)\n\nUntuk panduan gerakan dan bacaan lengkap, silakan sebutkan nama sholat yang ingin dipelajari (misal: "tata cara sholat subuh").`;
          }
        }
        
        // Gabungkan semua prompt
        const fullPrompt = contextData 
          ? `${systemPrompt}\n\nBerikut adalah data yang bisa kamu gunakan untuk menjawab pertanyaan user:\n${contextData}\n\nSekarang jawab pertanyaan user dengan ramah dan informatif.`
          : systemPrompt;
        
        // Panggil Workers AI
        const stream = await env.AI.run('@cf/google/gemma-3-12b-it', {
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
