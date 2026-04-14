// src/services/XtreamService.ts
import axios, {AxiosInstance} from 'axios';
import {Channel, VodItem, Series, Episode, Category, EPGProgram} from '@store/types';

// ── Raw API response types ────────────────────────────────────────────────────
interface XtreamAuth {
  user_info: {
    username:      string;
    password:      string;
    status:        string;
    exp_date:      string;
    max_connections: string;
    active_cons:   string;
    is_trial:      string;
  };
  server_info: {
    url:        string;
    port:       string;
    https_port: string;
    server_protocol: string;
    rtmp_port:  string;
    timezone:   string;
    timestamp_now: number;
    time_now:   string;
  };
}

// ── Service ───────────────────────────────────────────────────────────────────
export class XtreamService {
  private client:      AxiosInstance;
  private baseUrl:     string;
  private credentials: string;
  private serverId:    number;

  constructor(opts: {
    host:     string;
    port:     number;
    username: string;
    password: string;
    serverId: number;
    https?:   boolean;
  }) {
    const protocol  = opts.https ? 'https' : 'http';
    this.baseUrl     = `${protocol}://${opts.host}:${opts.port}`;
    this.credentials = `username=${opts.username}&password=${opts.password}`;
    this.serverId    = opts.serverId;

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 15_000,
      headers: {
        'User-Agent': 'Teleon/1.0 Android',
      },
    });
  }

  // ── Auth ───────────────────────────────────────────────────────────────────
  async authenticate(): Promise<XtreamAuth> {
    const {data} = await this.client.get<XtreamAuth>(
      `/player_api.php?${this.credentials}`,
    );
    return data;
  }

  // ── Live TV ────────────────────────────────────────────────────────────────
  async getLiveCategories(): Promise<Category[]> {
    const {data} = await this.client.get<Array<{category_id: string; category_name: string; parent_id: string}>>(
      `/player_api.php?${this.credentials}&action=get_live_categories`,
    );
    return data.map((c) => ({
      categoryId:   c.category_id,
      categoryName: c.category_name,
      parentId:     c.parent_id || undefined,
    }));
  }

  async getLiveStreams(categoryId?: string): Promise<Channel[]> {
    const cat  = categoryId ? `&category_id=${categoryId}` : '';
    const {data} = await this.client.get<any[]>(
      `/player_api.php?${this.credentials}&action=get_live_streams${cat}`,
    );
    return data.map((s) => ({
      streamId:     Number(s.stream_id),
      num:          Number(s.num) || 0,
      name:         s.name ?? '',
      streamUrl:    this.buildLiveUrl(s.stream_id),
      logoUrl:      s.stream_icon ?? '',
      categoryId:   String(s.category_id ?? ''),
      categoryName: '',
      epgChannelId: s.epg_channel_id ?? undefined,
      tvArchive:    Number(s.tv_archive ?? 0),
      serverId:     this.serverId,
    }));
  }

  // ── VOD ────────────────────────────────────────────────────────────────────
  async getVodCategories(): Promise<Category[]> {
    const {data} = await this.client.get<any[]>(
      `/player_api.php?${this.credentials}&action=get_vod_categories`,
    );
    return data.map((c) => ({
      categoryId:   c.category_id,
      categoryName: c.category_name,
    }));
  }

  async getVodStreams(categoryId?: string): Promise<VodItem[]> {
    const cat  = categoryId ? `&category_id=${categoryId}` : '';
    const {data} = await this.client.get<any[]>(
      `/player_api.php?${this.credentials}&action=get_vod_streams${cat}`,
    );
    return data.map((v) => ({
      vodId:        Number(v.stream_id),
      name:         v.name ?? '',
      streamUrl:    this.buildVodUrl(v.stream_id, v.container_extension ?? 'mp4'),
      posterUrl:    v.stream_icon ?? v.movie_image ?? '',
      categoryId:   String(v.category_id ?? ''),
      categoryName: '',
      plot:         v.plot ?? undefined,
      cast:         v.cast ?? undefined,
      director:     v.director ?? undefined,
      genre:        v.genre ?? undefined,
      releaseDate:  v.releaseDate ?? undefined,
      rating:       v.rating ?? undefined,
      duration:     v.duration ?? undefined,
      serverId:     this.serverId,
    }));
  }

  async getVodInfo(vodId: number): Promise<Partial<VodItem>> {
    const {data} = await this.client.get<{info: any; movie_data: any}>(
      `/player_api.php?${this.credentials}&action=get_vod_info&vod_id=${vodId}`,
    );
    const i = data.info ?? {};
    return {
      plot:        i.plot,
      cast:        i.cast,
      director:    i.director,
      genre:       i.genre,
      releaseDate: i.releasedate,
      rating:      i.rating,
      duration:    i.duration,
      posterUrl:   i.movie_image ?? i.cover_big,
    };
  }

  // ── Series ─────────────────────────────────────────────────────────────────
  async getSeriesCategories(): Promise<Category[]> {
    const {data} = await this.client.get<any[]>(
      `/player_api.php?${this.credentials}&action=get_series_categories`,
    );
    return data.map((c) => ({
      categoryId:   c.category_id,
      categoryName: c.category_name,
    }));
  }

  async getSeries(categoryId?: string): Promise<Series[]> {
    const cat  = categoryId ? `&category_id=${categoryId}` : '';
    const {data} = await this.client.get<any[]>(
      `/player_api.php?${this.credentials}&action=get_series${cat}`,
    );
    return data.map((s) => ({
      seriesId:     Number(s.series_id),
      name:         s.name ?? '',
      posterUrl:    s.cover ?? '',
      coverUrl:     s.backdrop_path?.[0] ?? s.cover ?? '',
      categoryId:   String(s.category_id ?? ''),
      categoryName: '',
      plot:         s.plot ?? undefined,
      cast:         s.cast ?? undefined,
      director:     s.director ?? undefined,
      genre:        s.genre ?? undefined,
      rating:       s.rating ?? undefined,
      serverId:     this.serverId,
    }));
  }

  async getSeriesInfo(seriesId: number): Promise<{seasons: Record<string, Episode[]>}> {
    const {data} = await this.client.get<{episodes: Record<string, any[]>}>(
      `/player_api.php?${this.credentials}&action=get_series_info&series_id=${seriesId}`,
    );
    const seasons: Record<string, Episode[]> = {};
    for (const [season, eps] of Object.entries(data.episodes ?? {})) {
      seasons[season] = (eps as any[]).map((e) => ({
        episodeId:  Number(e.id),
        seriesId,
        season:     Number(season),
        episodeNum: Number(e.episode_num),
        title:      e.title ?? `Bölüm ${e.episode_num}`,
        streamUrl:  this.buildEpisodeUrl(e.id, e.container_extension ?? 'mkv'),
        duration:   e.info?.duration ?? undefined,
        plot:       e.info?.plot ?? undefined,
        posterUrl:  e.info?.movie_image ?? undefined,
      }));
    }
    return {seasons};
  }

  // ── EPG ───────────────────────────────────────────────────────────────────
  async getShortEPG(streamId: number, limit = 4): Promise<EPGProgram[]> {
    const {data} = await this.client.get<{epg_listings: any[]}>(
      `/player_api.php?${this.credentials}&action=get_short_epg&stream_id=${streamId}&limit=${limit}`,
    );
    return (data.epg_listings ?? []).map((e) => this.mapEPGItem(e, String(streamId)));
  }

  async getFullEPG(streamId: number): Promise<EPGProgram[]> {
    const {data} = await this.client.get<{epg_listings: any[]}>(
      `/player_api.php?${this.credentials}&action=get_simple_data_table&stream_id=${streamId}`,
    );
    return (data.epg_listings ?? []).map((e) => this.mapEPGItem(e, String(streamId)));
  }

  // ── URL builders ──────────────────────────────────────────────────────────
  buildLiveUrl(streamId: number | string, ext = 'ts'): string {
    const [user, pass] = this.parseCredentials();
    return `${this.baseUrl}/live/${user}/${pass}/${streamId}.${ext}`;
  }

  buildVodUrl(vodId: number | string, ext = 'mp4'): string {
    const [user, pass] = this.parseCredentials();
    return `${this.baseUrl}/movie/${user}/${pass}/${vodId}.${ext}`;
  }

  buildEpisodeUrl(episodeId: number | string, ext = 'mkv'): string {
    const [user, pass] = this.parseCredentials();
    return `${this.baseUrl}/series/${user}/${pass}/${episodeId}.${ext}`;
  }

  // ── Private helpers ───────────────────────────────────────────────────────
  private parseCredentials(): [string, string] {
    const parts = this.credentials.split('&');
    const user  = parts[0].split('=')[1] ?? '';
    const pass  = parts[1].split('=')[1] ?? '';
    return [user, pass];
  }

  private mapEPGItem(e: any, channelId: string): EPGProgram {
    const now = Date.now();
    const start = Number(e.start_timestamp) * 1000 || now;
    const end   = Number(e.stop_timestamp)  * 1000 || now + 3600_000;
    return {
      id:          e.id ?? `${channelId}-${start}`,
      channelId,
      title:       this.decodeB64(e.title ?? ''),
      description: this.decodeB64(e.description ?? ''),
      startTime:   start,
      endTime:     end,
      isLive:      start <= now && now <= end,
    };
  }

  private decodeB64(str: string): string {
    try {
      return str ? Buffer.from(str, 'base64').toString('utf-8') : '';
    } catch {
      return str;
    }
  }
}
