// src/__tests__/M3UParser.test.ts
import {M3UParser} from '../services/M3UParser';

const SAMPLE_M3U = `#EXTM3U
#EXTINF:-1 tvg-id="trt1" tvg-name="TRT 1" tvg-logo="https://example.com/trt1.png" group-title="Ulusal",TRT 1
http://example.com/live/user/pass/101.ts
#EXTINF:-1 tvg-id="atv" tvg-name="ATV" tvg-logo="https://example.com/atv.png" group-title="Ulusal",ATV
http://example.com/live/user/pass/102.ts
#EXTINF:-1 tvg-id="fox" tvg-name="FOX TV" tvg-logo="https://example.com/fox.png" group-title="Ulusal",FOX TV
http://example.com/live/user/pass/103.ts
#EXTINF:-1 tvg-id="beinsports1" tvg-name="beIN Sports 1" group-title="Spor",beIN Sports 1
http://example.com/live/user/pass/201.ts
#EXTINF:-1 tvg-id="trtspor" tvg-name="TRT Spor" group-title="Spor",TRT Spor
http://example.com/live/user/pass/202.ts
`;

describe('M3UParser', () => {
  let parser: M3UParser;

  beforeEach(() => {
    parser = new M3UParser(1);
  });

  test('doğru kanal sayısını parse eder', () => {
    const result = parser.parse(SAMPLE_M3U);
    expect(result.total).toBe(5);
    expect(result.channels).toHaveLength(5);
    expect(result.errors).toBe(0);
  });

  test('kanal isimlerini doğru çıkarır', () => {
    const result = parser.parse(SAMPLE_M3U);
    expect(result.channels[0].name).toBe('TRT 1');
    expect(result.channels[1].name).toBe('ATV');
    expect(result.channels[2].name).toBe('FOX TV');
  });

  test('logo URL\'lerini doğru çıkarır', () => {
    const result = parser.parse(SAMPLE_M3U);
    expect(result.channels[0].logoUrl).toBe('https://example.com/trt1.png');
    expect(result.channels[3].logoUrl).toBe(''); // logo yoksa boş
  });

  test('kategori gruplarını doğru oluşturur', () => {
    const result = parser.parse(SAMPLE_M3U);
    expect(result.categories).toHaveLength(2);
    const catNames = result.categories.map((c) => c.categoryName);
    expect(catNames).toContain('Ulusal');
    expect(catNames).toContain('Spor');
  });

  test('stream URL\'lerini doğru atar', () => {
    const result = parser.parse(SAMPLE_M3U);
    expect(result.channels[0].streamUrl).toBe('http://example.com/live/user/pass/101.ts');
  });

  test('tvg-id\'yi epgChannelId olarak atar', () => {
    const result = parser.parse(SAMPLE_M3U);
    expect(result.channels[0].epgChannelId).toBe('trt1');
  });

  test('serverId\'yi doğru atar', () => {
    const result = parser.parse(SAMPLE_M3U);
    result.channels.forEach((ch) => {
      expect(ch.serverId).toBe(1);
    });
  });

  test('boş içerik için hata vermez', () => {
    const result = parser.parse('#EXTM3U\n');
    expect(result.total).toBe(0);
    expect(result.errors).toBe(0);
  });

  test('#EXTM3U başlığı olmadan da parse eder', () => {
    const withoutHeader = SAMPLE_M3U.replace('#EXTM3U\n', '');
    const result = parser.parse(withoutHeader);
    expect(result.total).toBe(5);
  });
});
