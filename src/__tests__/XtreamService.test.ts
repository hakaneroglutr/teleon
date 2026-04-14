// src/__tests__/XtreamService.test.ts
import {XtreamService} from '../services/XtreamService';

// Gerçek ağ isteklerini mock'la
jest.mock('axios', () => ({
  create: () => ({
    get: jest.fn(),
  }),
}));

describe('XtreamService URL builders', () => {
  const svc = new XtreamService({
    host:     'bir.dance',
    port:     8080,
    username: '5YSDJSHNPR',
    password: 'MvfWcvj642',
    serverId: 1,
  });

  test('live stream URL doğru oluşur', () => {
    const url = svc.buildLiveUrl(101);
    expect(url).toBe('http://bir.dance:8080/live/5YSDJSHNPR/MvfWcvj642/101.ts');
  });

  test('live stream URL özel extension ile', () => {
    const url = svc.buildLiveUrl(101, 'm3u8');
    expect(url).toBe('http://bir.dance:8080/live/5YSDJSHNPR/MvfWcvj642/101.m3u8');
  });

  test('VOD URL doğru oluşur', () => {
    const url = svc.buildVodUrl(55, 'mp4');
    expect(url).toBe('http://bir.dance:8080/movie/5YSDJSHNPR/MvfWcvj642/55.mp4');
  });

  test('dizi bölüm URL doğru oluşur', () => {
    const url = svc.buildEpisodeUrl(999, 'mkv');
    expect(url).toBe('http://bir.dance:8080/series/5YSDJSHNPR/MvfWcvj642/999.mkv');
  });
});
