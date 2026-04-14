// src/services/StalkerService.ts
// Stalker Portal / Middleware API client
// MAC adresi tabanlı kimlik doğrulama

import axios, {AxiosInstance} from 'axios';
import {Channel, Category} from '@store/types';

interface StalkerToken {
  token:     string;
  random:    string;
  mac:       string;
  timestamp: number;
}

export class StalkerService {
  private client:   AxiosInstance;
  private portalUrl: string;
  private mac:      string;
  private token:    StalkerToken | null = null;
  private serverId: number;

  constructor(opts: {
    portalUrl: string;
    mac:       string;
    serverId:  number;
  }) {
    this.portalUrl = opts.portalUrl.replace(/\/$/, '');
    this.mac       = opts.mac;
    this.serverId  = opts.serverId;

    this.client = axios.create({
      baseURL: this.portalUrl,
      timeout: 15_000,
      headers: {
        'User-Agent':   'Mozilla/5.0 (QtEmbedded; U; Linux; C)',
        'X-User-Agent': 'Model: MAG250; Link: WiFi',
        'Referer':      `${this.portalUrl}/c/`,
      },
    });
  }

  // ── Handshake ──────────────────────────────────────────────────────────────
  async handshake(): Promise<string> {
    const {data} = await this.client.get('/portal.php', {
      params: {
        type:   'stb',
        action: 'handshake',
        prehash: 0,
        token:  '',
        JsHttpRequest: `1-xml`,
      },
      headers: {
        Cookie: `mac=${this.mac}; stb_lang=en; timezone=Europe/Istanbul`,
      },
    });
    const token = data?.js?.token ?? '';
    this.token  = {token, random: '', mac: this.mac, timestamp: Date.now()};
    return token;
  }

  // ── Auth ───────────────────────────────────────────────────────────────────
  async authenticate(): Promise<void> {
    if (!this.token) await this.handshake();

    await this.client.get('/portal.php', {
      params: {
        type:          'stb',
        action:        'get_profile',
        hd:            '1',
        ver:           'ImageDescription: 0.2.18-r23-787; ImageDate: Thu Dec 10 13:00:18 UTC 2020',
        num_banks:     '1',
        sn:            'TELE0N000000',
        stb_type:      'MAG250',
        client_type:   'STB',
        image_version: '218',
        JsHttpRequest: '1-xml',
      },
      headers: this.buildHeaders(),
    });
  }

  // ── Live TV ────────────────────────────────────────────────────────────────
  async getLiveCategories(): Promise<Category[]> {
    const {data} = await this.stalkerGet('itv', 'get_genres', {});
    const list = data?.js?.data ?? [];
    return list.map((g: any) => ({
      categoryId:   String(g.id),
      categoryName: g.title ?? g.name ?? '',
    }));
  }

  async getLiveStreams(genreId?: string): Promise<Channel[]> {
    const params: Record<string, any> = {
      type:   'itv',
      action: 'get_ordered_list',
      genre:  genreId ?? '*',
      force_ch_link_check: 1,
      fav:    0,
      sortby: 'number',
      p:      1,
    };

    const channels: Channel[] = [];
    let page = 1;

    while (true) {
      params.p = page;
      const {data} = await this.stalkerGet('itv', 'get_ordered_list', params);
      const items  = data?.js?.data ?? [];

      for (const ch of items) {
        channels.push({
          streamId:     Number(ch.id),
          num:          Number(ch.number) || page,
          name:         ch.name ?? '',
          streamUrl:    await this.buildStalkerStreamUrl(ch.cmd),
          logoUrl:      ch.logo ?? '',
          categoryId:   genreId ?? 'all',
          categoryName: '',
          serverId:     this.serverId,
        });
      }

      const totalItems = Number(data?.js?.total_items ?? 0);
      const maxPageItems = Number(data?.js?.max_page_items ?? 14);
      if (channels.length >= totalItems || items.length === 0) break;
      page++;
    }

    return channels;
  }

  // ── Private helpers ───────────────────────────────────────────────────────
  private async stalkerGet(type: string, action: string, extraParams: Record<string, any>) {
    if (!this.token) await this.handshake();
    return this.client.get('/portal.php', {
      params: {
        type,
        action,
        ...extraParams,
        JsHttpRequest: '1-xml',
      },
      headers: this.buildHeaders(),
    });
  }

  private buildHeaders(): Record<string, string> {
    return {
      Cookie:         `mac=${this.mac}; stb_lang=en; timezone=Europe/Istanbul`,
      Authorization:  `Bearer ${this.token?.token ?? ''}`,
    };
  }

  private async buildStalkerStreamUrl(cmd: string): Promise<string> {
    // Stalker "cmd" genellikle ffmpeg:// veya http:// şeklindedir
    if (!cmd) return '';
    if (cmd.startsWith('http')) return cmd;

    // ffmpeg:// komutundan URL çıkar
    const match = cmd.match(/https?:\/\/[^\s]+/);
    if (match) return match[0];

    // create_link ile dinamik URL al
    try {
      const {data} = await this.stalkerGet('itv', 'create_link', {cmd, series: 0});
      return data?.js?.cmd ?? '';
    } catch {
      return cmd;
    }
  }
}
