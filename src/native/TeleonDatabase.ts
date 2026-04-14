// src/native/TeleonDatabase.ts
//
// TypeScript köprüsü — Kotlin tarafı: TeleonDatabaseModule.kt
// SQLite işlemleri (15 tablo): kanallar, favoriler, geçmiş, sunucular, portal

import {NativeModules, Platform} from 'react-native';

const {TeleonDatabaseModule} = NativeModules;

if (!TeleonDatabaseModule && Platform.OS === 'android') {
  console.warn('[TeleonDatabase] Native module not found.');
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface DBChannel {
  pk_id?:    number;
  server_id: number;
  channel:   string;   // JSON string of Channel object
}

export interface DBServer {
  pk_id?:         number;
  server:         string;
  servername:     string;
  mac?:           string;
  user?:          string;
  password?:      string;
  use_credential: number;  // 0 | 1
  is_active:      number;  // 0 | 1
}

export interface DBPortal {
  id?:           number;
  portalid:      string;
  portalname:    string;
  portaladdress: string;
  portalcode:    string;
}

export interface DBRecent {
  pk_id?:     number;
  NAME:       string;
  TIME:       string;
  TOTALTIME:  string;
}

// ── API ───────────────────────────────────────────────────────────────────────
export const TeleonDatabase = {
  // ── Channels ─────────────────────────────────────────────────────────────
  insertChannel: (serverId: number, channelJson: string): Promise<number> =>
    TeleonDatabaseModule.insertChannel(serverId, channelJson),

  getChannels: (serverId: number): Promise<string[]> =>
    TeleonDatabaseModule.getChannels(serverId),

  clearChannels: (serverId: number): Promise<void> =>
    TeleonDatabaseModule.clearChannels(serverId),

  // ── Favourites ───────────────────────────────────────────────────────────
  addFavourite: (channelJson: string): Promise<void> =>
    TeleonDatabaseModule.addFavourite(channelJson),

  removeFavourite: (channelJson: string): Promise<void> =>
    TeleonDatabaseModule.removeFavourite(channelJson),

  getFavourites: (): Promise<string[]> =>
    TeleonDatabaseModule.getFavourites(),

  addVodFavourite: (channelJson: string): Promise<void> =>
    TeleonDatabaseModule.addVodFavourite(channelJson),

  removeVodFavourite: (channelJson: string): Promise<void> =>
    TeleonDatabaseModule.removeVodFavourite(channelJson),

  getVodFavourites: (): Promise<string[]> =>
    TeleonDatabaseModule.getVodFavourites(),

  addSeriesFavourite: (channelJson: string): Promise<void> =>
    TeleonDatabaseModule.addSeriesFavourite(channelJson),

  removeSeriesFavourite: (channelJson: string): Promise<void> =>
    TeleonDatabaseModule.removeSeriesFavourite(channelJson),

  getSeriesFavourites: (): Promise<string[]> =>
    TeleonDatabaseModule.getSeriesFavourites(),

  // ── History ──────────────────────────────────────────────────────────────
  addLiveHistory: (channelJson: string): Promise<void> =>
    TeleonDatabaseModule.addLiveHistory(channelJson),

  getLiveHistory: (): Promise<string[]> =>
    TeleonDatabaseModule.getLiveHistory(),

  addVodHistory: (channelJson: string): Promise<void> =>
    TeleonDatabaseModule.addVodHistory(channelJson),

  getVodHistory: (): Promise<string[]> =>
    TeleonDatabaseModule.getVodHistory(),

  addSeriesHistory: (channelJson: string): Promise<void> =>
    TeleonDatabaseModule.addSeriesHistory(channelJson),

  getSeriesHistory: (): Promise<string[]> =>
    TeleonDatabaseModule.getSeriesHistory(),

  // ── Recent (VOD position tracking) ───────────────────────────────────────
  upsertRecent: (name: string, time: string, totalTime: string): Promise<void> =>
    TeleonDatabaseModule.upsertRecent(name, time, totalTime),

  getRecent: (name: string): Promise<DBRecent | null> =>
    TeleonDatabaseModule.getRecent(name),

  // ── Recent channels ───────────────────────────────────────────────────────
  addRecentChannel: (catId: string, catName: string, chName: string): Promise<void> =>
    TeleonDatabaseModule.addRecentChannel(catId, catName, chName),

  getRecentChannels: (): Promise<Array<{CATID: string; CATNAME: string; CHNAME: string}>> =>
    TeleonDatabaseModule.getRecentChannels(),

  // ── Servers ──────────────────────────────────────────────────────────────
  insertServer: (server: DBServer): Promise<number> =>
    TeleonDatabaseModule.insertServer(server),

  updateServer: (pkId: number, server: Partial<DBServer>): Promise<void> =>
    TeleonDatabaseModule.updateServer(pkId, server),

  deleteServer: (pkId: number): Promise<void> =>
    TeleonDatabaseModule.deleteServer(pkId),

  getServers: (): Promise<DBServer[]> =>
    TeleonDatabaseModule.getServers(),

  // ── FastCode Portals ─────────────────────────────────────────────────────
  insertPortal: (portal: DBPortal): Promise<number> =>
    TeleonDatabaseModule.insertPortal(portal),

  deletePortal: (id: number): Promise<void> =>
    TeleonDatabaseModule.deletePortal(id),

  getPortals: (): Promise<DBPortal[]> =>
    TeleonDatabaseModule.getPortals(),

  // ── Series progress ───────────────────────────────────────────────────────
  upsertSeriesProgress: (seriesName: string, seasonName: string, episodeName: string): Promise<void> =>
    TeleonDatabaseModule.upsertSeriesProgress(seriesName, seasonName, episodeName),

  getSeriesProgress: (seriesName: string): Promise<{season: string; episode: string} | null> =>
    TeleonDatabaseModule.getSeriesProgress(seriesName),
} as const;
