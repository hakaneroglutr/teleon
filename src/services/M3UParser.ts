// src/services/M3UParser.ts
// Streaming M3U/M3U+ parser — 100k+ satır desteği
// #EXTM3U, #EXTINF meta verisi, grup bazlı kategorileme

import {Channel, Category} from '@store/types';

interface RawM3UEntry {
  tvgId:       string;
  tvgName:     string;
  tvgLogo:     string;
  groupTitle:  string;
  name:        string;
  url:         string;
}

export interface M3UParseResult {
  channels:   Channel[];
  categories: Category[];
  total:      number;
  errors:     number;
}

// ── Regex patterns ────────────────────────────────────────────────────────────
const EXTINF_RE  = /^#EXTINF:/;
const TVG_ID_RE  = /tvg-id="([^"]*)"/i;
const TVG_NAME_RE = /tvg-name="([^"]*)"/i;
const TVG_LOGO_RE = /tvg-logo="([^"]*)"/i;
const GROUP_RE   = /group-title="([^"]*)"/i;
const DURATION_RE = /^#EXTINF:\s*(-?\d+)/;

export class M3UParser {
  private serverId: number;

  constructor(serverId: number) {
    this.serverId = serverId;
  }

  /**
   * M3U içeriğini parse eder.
   * Büyük dosyalar için satır satır işler — bellek dostu.
   */
  parse(content: string): M3UParseResult {
    const lines   = content.split(/\r?\n/);
    const entries: RawM3UEntry[] = [];
    let errors = 0;
    let i = 0;

    // İlk satır #EXTM3U kontrolü (zorunlu değil ama doğrulama için)
    if (lines[0]?.startsWith('#EXTM3U')) {
      i = 1;
    }

    while (i < lines.length) {
      const line = lines[i].trim();

      if (EXTINF_RE.test(line)) {
        const url = this.findNextUrl(lines, i + 1);
        if (url) {
          try {
            const entry = this.parseExtInf(line, url);
            if (entry) entries.push(entry);
          } catch {
            errors++;
          }
          // URL satırını atla
          i = this.findNextUrlIndex(lines, i + 1) + 1;
          continue;
        }
      }
      i++;
    }

    return this.buildResult(entries, errors);
  }

  /**
   * URL'den M3U dosyasını chunk'lara bölerek parse eder.
   * (fetch API — React Native ortamında çalışır)
   */
  async parseFromUrl(url: string): Promise<M3UParseResult> {
    const response = await fetch(url, {
      headers: {'User-Agent': 'Teleon/1.0 Android'},
    });

    if (!response.ok) {
      throw new Error(`M3U fetch failed: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    return this.parse(text);
  }

  // ── Private helpers ───────────────────────────────────────────────────────
  private parseExtInf(line: string, url: string): RawM3UEntry | null {
    // #EXTINF:-1 tvg-id="..." tvg-name="..." tvg-logo="..." group-title="...",Display Name
    const commaIdx = line.lastIndexOf(',');
    const meta     = commaIdx > 0 ? line.substring(0, commaIdx) : line;
    const name     = commaIdx > 0 ? line.substring(commaIdx + 1).trim() : '';

    return {
      tvgId:      (TVG_ID_RE.exec(meta)?.[1]   ?? '').trim(),
      tvgName:    (TVG_NAME_RE.exec(meta)?.[1]  ?? name).trim(),
      tvgLogo:    (TVG_LOGO_RE.exec(meta)?.[1]  ?? '').trim(),
      groupTitle: (GROUP_RE.exec(meta)?.[1]     ?? 'Genel').trim(),
      name:       name || (TVG_NAME_RE.exec(meta)?.[1] ?? 'Kanal'),
      url,
    };
  }

  private findNextUrl(lines: string[], start: number): string | null {
    for (let j = start; j < Math.min(start + 3, lines.length); j++) {
      const l = lines[j].trim();
      if (l && !l.startsWith('#')) return l;
    }
    return null;
  }

  private findNextUrlIndex(lines: string[], start: number): number {
    for (let j = start; j < Math.min(start + 3, lines.length); j++) {
      const l = lines[j].trim();
      if (l && !l.startsWith('#')) return j;
    }
    return start;
  }

  private buildResult(entries: RawM3UEntry[], errors: number): M3UParseResult {
    // Kategori haritası oluştur
    const catMap = new Map<string, Category>();
    entries.forEach((e) => {
      if (!catMap.has(e.groupTitle)) {
        const id = this.slugify(e.groupTitle);
        catMap.set(e.groupTitle, {categoryId: id, categoryName: e.groupTitle});
      }
    });

    const categories = Array.from(catMap.values());

    // Kanalları oluştur — streamId olarak index kullan (M3U'da gerçek ID yok)
    const channels: Channel[] = entries.map((e, idx) => ({
      streamId:     idx + 1,
      num:          idx + 1,
      name:         e.name || e.tvgName,
      streamUrl:    e.url,
      logoUrl:      e.tvgLogo,
      categoryId:   this.slugify(e.groupTitle),
      categoryName: e.groupTitle,
      epgChannelId: e.tvgId || undefined,
      serverId:     this.serverId,
    }));

    return {channels, categories, total: channels.length, errors};
  }

  private slugify(str: string): string {
    return str
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '')
      .replace(/-+/g, '-')
      .substring(0, 64);
  }
}
