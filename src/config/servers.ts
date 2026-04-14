// src/config/servers.ts
// Gerçek sunucu yapılandırması — bir.dance Xtream Codes

export const DEMO_SERVER = {
  name:     'bir.dance',
  type:     'xtream' as const,
  host:     'bir.dance',
  port:     8080,
  username: '5YSDJSHNPR',
  password: 'MvfWcvj642',
  isActive: true,
};

// Xtream API base URL
export function buildXtreamBase(host: string, port: number): string {
  return `http://${host}:${port}`;
}

// Stream URL şablonları
export function buildStreamUrls(host: string, port: number, user: string, pass: string) {
  const base = buildXtreamBase(host, port);
  return {
    live:   (id: number | string, ext = 'ts')  => `${base}/live/${user}/${pass}/${id}.${ext}`,
    vod:    (id: number | string, ext = 'mp4')  => `${base}/movie/${user}/${pass}/${id}.${ext}`,
    series: (id: number | string, ext = 'mkv')  => `${base}/series/${user}/${pass}/${id}.${ext}`,
    api:    () => `${base}/player_api.php?username=${user}&password=${pass}`,
    m3u:    () => `${base}/get.php?username=${user}&password=${pass}&type=m3u_plus&output=mpegts`,
  };
}

// Yaygın Xtream portları
export const COMMON_PORTS = [8080, 80, 8000, 2082, 25461];

// Sunucu türü otomatik tespiti
export function detectServerType(url: string): 'xtream' | 'm3u' | 'stalker' {
  if (url.includes('get.php') || url.includes('.m3u')) return 'm3u';
  if (url.includes('stalker_portal') || url.includes('portal.php')) return 'stalker';
  if (url.includes('player_api.php')) return 'xtream';
  return 'xtream';
}

// URL'den Xtream credentials parse et
export function parseXtreamUrl(url: string): {host: string; port: number; username: string; password: string} | null {
  try {
    const u = new URL(url);
    const params = new URLSearchParams(u.search);
    const username = params.get('username') ?? '';
    const password = params.get('password') ?? '';
    if (!username || !password) return null;
    return {
      host:     u.hostname,
      port:     u.port ? parseInt(u.port) : 80,
      username,
      password,
    };
  } catch {
    return null;
  }
}
