// src/services/prayer.ts
import { prayerData } from '../data/prayerData';

export interface PrayerStep {
  movement: string;
  recitation_arabic: string;
  recitation_latin: string;
  translation: string;
}

export interface PrayerInfo {
  rakaat: number;
  steps: PrayerStep[];
}

export function getPrayerGuidance(prayerName: string): PrayerInfo | null {
  const normalizedName = prayerName.toLowerCase();
  
  // Mapping nama sholat
  const prayerMapping: Record<string, string> = {
    'subuh': 'subuh',
    'fajar': 'subuh',
    'dzuhur': 'dzuhur',
    'zuhur': 'dzuhur',
    'lunch': 'dzuhur',
    'ashar': 'ashar',
    'asar': 'ashar',
    'maghrib': 'maghrib',
    'isya': 'isya',
    'isya\'': 'isya',
    'isha': 'isya'
  };
  
  const key = prayerMapping[normalizedName];
  if (!key || !prayerData.sholat_wajib[key as keyof typeof prayerData.sholat_wajib]) {
    return null;
  }
  
  return prayerData.sholat_wajib[key as keyof typeof prayerData.sholat_wajib] as PrayerInfo;
}

export function getAllPrayers(): string[] {
  return Object.keys(prayerData.sholat_wajib);
}

export function formatPrayerGuidance(prayerName: string): string {
  const guidance = getPrayerGuidance(prayerName);
  if (!guidance) {
    return `Maaf, panduan untuk sholat ${prayerName} tidak tersedia. Sholat yang tersedia: ${getAllPrayers().join(', ')}`;
  }
  
  let result = `📖 *PANDUAN SHOLAT ${prayerName.toUpperCase()}* 📖\n`;
  result += `🕌 Jumlah Rakaat: ${guidance.rakaat}\n\n`;
  result += `🔹 *URUTAN GERAKAN & BACAAN:* 🔹\n\n`;
  
  guidance.steps.forEach((step, index) => {
    result += `${index + 1}. **${step.movement}**\n`;
    if (step.recitation_arabic) {
      result += `   🇦🇪 ${step.recitation_arabic}\n`;
      result += `   🗣️ ${step.recitation_latin}\n`;
      result += `   🇮🇩 ${step.translation}\n\n`;
    } else {
      result += `   ℹ️ ${step.translation || step.movement}\n\n`;
    }
  });
  
  return result;
}

// Untuk mendapatkan step spesifik
export function getSpecificStep(prayerName: string, stepNumber: number): PrayerStep | null {
  const guidance = getPrayerGuidance(prayerName);
  if (!guidance || stepNumber < 1 || stepNumber > guidance.steps.length) {
    return null;
  }
  return guidance.steps[stepNumber - 1];
}