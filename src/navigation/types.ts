// src/navigation/types.ts
import {StackNavigationProp} from '@react-navigation/stack';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {CompositeNavigationProp, RouteProp} from '@react-navigation/native';

// ── Root Stack ────────────────────────────────────────────────────────────────
export type RootStackParamList = {
  Splash:       undefined;
  Main:         undefined;
  Player: {
    streamUrl:  string;
    title:      string;
    streamId?:  number;
    engine?:    'vlc' | 'exo';
    posterUrl?: string;
  };
  AddServer:    {editId?: number};
  Search:       {initialQuery?: string};
  VodDetail:    {vodId: number; title: string; posterUrl?: string};
  SeriesDetail: {seriesId: number; title: string; posterUrl?: string};
  EpisodeList:  {seriesId: number; season: number; title: string};
  MultiScreen:  undefined;
  Catchup:      {streamId: number; channelName: string};
};

// ── Bottom Tabs ───────────────────────────────────────────────────────────────
export type TabParamList = {
  Home:      undefined;
  LiveTV:    {categoryId?: string};
  Movies:    {categoryId?: string};
  Series:    {categoryId?: string};
  EPG:       undefined;
  Favorites: undefined;
  Settings:  undefined;
};

// ── Composite nav types ───────────────────────────────────────────────────────
export type RootNavProp = StackNavigationProp<RootStackParamList>;
export type TabNavProp  = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList>,
  StackNavigationProp<RootStackParamList>
>;

// ── Route props ───────────────────────────────────────────────────────────────
export type PlayerRouteProp       = RouteProp<RootStackParamList, 'Player'>;
export type VodDetailRouteProp    = RouteProp<RootStackParamList, 'VodDetail'>;
export type SeriesDetailRouteProp = RouteProp<RootStackParamList, 'SeriesDetail'>;
export type EpisodeListRouteProp  = RouteProp<RootStackParamList, 'EpisodeList'>;
export type AddServerRouteProp    = RouteProp<RootStackParamList, 'AddServer'>;
export type CatchupRouteProp      = RouteProp<RootStackParamList, 'Catchup'>;
