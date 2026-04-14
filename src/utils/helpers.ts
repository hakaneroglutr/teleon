// src/utils/helpers.ts

/** ms → "mm:ss" veya "hh:mm:ss" */
export function formatDuration(ms: number): string {
  if (!ms || ms <= 0) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${m}:${pad(s)}`;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Unix timestamp → "HH:MM" */
export function formatHHMM(timestamp: number): string {
  const d = new Date(timestamp);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Unix timestamp → "Pzt, 15 Oca" */
export function formatDateShort(timestamp: number): string {
  const d = new Date(timestamp);
  const days  = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  const months = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
}

/** İki tarih arasındaki dakika farkı */
export function minutesBetween(a: number, b: number): number {
  return Math.round(Math.abs(b - a) / 60_000);
}

/** Bir programın şu an oynanıp oynanmadığı */
export function isLiveNow(startMs: number, endMs: number): boolean {
  const now = Date.now();
  return now >= startMs && now <= endMs;
}

/** Bir programın ilerleme oranı (0-1) */
export function epgProgress(startMs: number, endMs: number): number {
  const now = Date.now();
  if (now < startMs) return 0;
  if (now > endMs) return 1;
  return (now - startMs) / (endMs - startMs);
}

/** URL'den stream türünü tahmin et */
export function guessStreamEngine(url: string): 'vlc' | 'exo' {
  const lower = url.toLowerCase();
  if (lower.includes('.m3u8') || lower.includes('hls')) return 'exo';
  if (lower.includes('.mpd')  || lower.includes('dash')) return 'exo';
  if (lower.startsWith('rtsp://') || lower.startsWith('rtmp://')) return 'vlc';
  return 'vlc'; // varsayılan
}

/** Truncate string */
export function truncate(str: string, max: number): string {
  if (!str) return '';
  return str.length <= max ? str : `${str.slice(0, max - 1)}…`;
}

/** İsimden ilk iki harf baş harf (avatar için) */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
