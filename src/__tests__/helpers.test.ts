// src/__tests__/helpers.test.ts
import {
  formatDuration,
  formatHHMM,
  isLiveNow,
  epgProgress,
  guessStreamEngine,
  truncate,
  initials,
} from '../utils/helpers';

describe('formatDuration', () => {
  test('sıfır döndürür', () => {
    expect(formatDuration(0)).toBe('0:00');
  });

  test('dakika:saniye formatı', () => {
    expect(formatDuration(90_000)).toBe('1:30');    // 90 sn
    expect(formatDuration(3600_000)).toBe('1:00:00'); // 1 saat
  });

  test('saat:dakika:saniye formatı', () => {
    expect(formatDuration(5400_000)).toBe('1:30:00'); // 1.5 saat
  });

  test('negatif değer için sıfır döndürür', () => {
    expect(formatDuration(-1000)).toBe('0:00');
  });
});

describe('isLiveNow', () => {
  test('şu anki yayın doğru tespit edilir', () => {
    const now   = Date.now();
    const start = now - 1000 * 60 * 30;  // 30 dk önce
    const end   = now + 1000 * 60 * 30;  // 30 dk sonra
    expect(isLiveNow(start, end)).toBe(true);
  });

  test('geçmiş yayın false döner', () => {
    const past = Date.now() - 1000 * 60 * 60;
    expect(isLiveNow(past - 3600_000, past)).toBe(false);
  });

  test('gelecek yayın false döner', () => {
    const future = Date.now() + 1000 * 60 * 60;
    expect(isLiveNow(future, future + 3600_000)).toBe(false);
  });
});

describe('epgProgress', () => {
  test('başlangıçta 0 döner', () => {
    const now   = Date.now();
    const start = now + 1000; // henüz başlamadı
    const end   = now + 3600_000;
    expect(epgProgress(start, end)).toBe(0);
  });

  test('bitince 1 döner', () => {
    const now  = Date.now();
    const past = now - 3600_000;
    expect(epgProgress(past - 3600_000, past)).toBe(1);
  });

  test('ortasında 0.5 civarı döner', () => {
    const now   = Date.now();
    const start = now - 30_000;   // 30 sn önce başladı
    const end   = now + 30_000;   // 30 sn sonra bitiyor
    const p     = epgProgress(start, end);
    expect(p).toBeGreaterThan(0.4);
    expect(p).toBeLessThan(0.6);
  });
});

describe('guessStreamEngine', () => {
  test('HLS için exo döner', () => {
    expect(guessStreamEngine('http://example.com/stream.m3u8')).toBe('exo');
  });

  test('DASH için exo döner', () => {
    expect(guessStreamEngine('http://example.com/stream.mpd')).toBe('exo');
  });

  test('RTSP için vlc döner', () => {
    expect(guessStreamEngine('rtsp://camera.example.com/stream')).toBe('vlc');
  });

  test('RTMP için vlc döner', () => {
    expect(guessStreamEngine('rtmp://live.example.com/app/stream')).toBe('vlc');
  });

  test('TS stream için vlc döner (varsayılan)', () => {
    expect(guessStreamEngine('http://example.com/live/user/pass/101.ts')).toBe('vlc');
  });
});

describe('truncate', () => {
  test('kısa string değişmez', () => {
    expect(truncate('kısa metin', 20)).toBe('kısa metin');
  });

  test('uzun string kısaltılır ve … eklenir', () => {
    const result = truncate('çok uzun bir metin içeriği', 10);
    expect(result.length).toBeLessThanOrEqual(10);
    expect(result.endsWith('…')).toBe(true);
  });

  test('boş string boş döner', () => {
    expect(truncate('', 10)).toBe('');
  });
});

describe('initials', () => {
  test('iki kelimeli isimden iki harf alır', () => {
    expect(initials('Ahmet Yılmaz')).toBe('AY');
  });

  test('tek kelimeden iki harf alır', () => {
    expect(initials('TRT')).toBe('TR');
  });

  test('küçük harfler büyütülür', () => {
    expect(initials('bein sports')).toBe('BS');
  });
});
