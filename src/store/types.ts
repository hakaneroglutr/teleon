// src/store/types.ts
// Shared types used across stores

export interface Server {
  id:            number;
  name:          string;
  type:          'xtream' | 'stalker' | 'm3u';
  host:          string;
  port?:         number;
  username?:     string;
  password?:     string;
  mac?:          string;           // Stalker portal MAC
  m3uUrl?:       string;          // M3U direct URL
  isActive:      boolean;
  createdAt:     number;          // timestamp
}

export interface Channel {
  streamId:      number;
  num:           number;
  name:          string;
  streamUrl:     string;
  logoUrl:       string;
  categoryId:    string;
  categoryName:  string;
  epgChannelId?: string;
  tvArchive?:    number;
  serverId:      number;
}

export interface VodItem {
  vodId:         number;
  name:          string;
  streamUrl:     string;
  posterUrl:     string;
  categoryId:    string;
  categoryName:  string;
  plot?:         string;
  cast?:         string;
  director?:     string;
  genre?:        string;
  releaseDate?:  string;
  rating?:       string;
  duration?:     string;
  serverId:      number;
}

export interface Series {
  seriesId:     number;
  name:         string;
  posterUrl:    string;
  coverUrl:     string;
  categoryId:   string;
  categoryName: string;
  plot?:        string;
  cast?:        string;
  director?:    string;
  genre?:       string;
  rating?:      string;
  serverId:     number;
}

export interface Episode {
  episodeId:    number;
  seriesId:     number;
  season:       number;
  episodeNum:   number;
  title:        string;
  streamUrl:    string;
  duration?:    string;
  plot?:        string;
  posterUrl?:   string;
}

export interface Category {
  categoryId:   string;
  categoryName: string;
  parentId?:    string;
}

export interface EPGProgram {
  id:           string;
  channelId:    string;
  title:        string;
  description:  string;
  startTime:    number;   // unix ms
  endTime:      number;   // unix ms
  isLive?:      boolean;
}

export interface PlayerState {
  isPlaying:    boolean;
  isPaused:     boolean;
  isBuffering:  boolean;
  isError:      boolean;
  errorMsg:     string;
  position:     number;   // ms
  duration:     number;   // ms
  speed:        number;
  engine:       'vlc' | 'exo';
  volume:       number;   // 0-100
}
