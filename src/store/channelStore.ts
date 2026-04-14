// src/store/channelStore.ts
import {create} from 'zustand';
import {immer} from 'zustand/middleware/immer';
import {Channel, Category} from './types';

interface ChannelStore {
  channels:         Channel[];
  categories:       Category[];
  favouriteIds:     Set<number>;
  historyIds:       number[];          // ordered, newest first
  selectedCategory: string;           // 'all' | categoryId
  searchQuery:      string;
  isLoading:        boolean;

  // Computed
  filteredChannels: () => Channel[];

  // Actions
  setChannels:        (ch: Channel[]) => void;
  setCategories:      (cats: Category[]) => void;
  toggleFavourite:    (streamId: number) => void;
  addToHistory:       (streamId: number) => void;
  setCategory:        (id: string) => void;
  setSearch:          (q: string) => void;
  setLoading:         (v: boolean) => void;
  clearHistory:       () => void;
}

export const useChannelStore = create<ChannelStore>()(
  immer((set, get) => ({
    channels:         [],
    categories:       [],
    favouriteIds:     new Set(),
    historyIds:       [],
    selectedCategory: 'all',
    searchQuery:      '',
    isLoading:        false,

    filteredChannels: () => {
      const {channels, selectedCategory, searchQuery} = get();
      let result = channels;
      if (selectedCategory !== 'all') {
        result = result.filter((c) => c.categoryId === selectedCategory);
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        result = result.filter((c) => c.name.toLowerCase().includes(q));
      }
      return result;
    },

    setChannels:   (ch) => set((s) => { s.channels = ch; }),
    setCategories: (cats) => set((s) => { s.categories = cats; }),
    setLoading:    (v) => set((s) => { s.isLoading = v; }),
    setCategory:   (id) => set((s) => { s.selectedCategory = id; }),
    setSearch:     (q) => set((s) => { s.searchQuery = q; }),

    toggleFavourite: (id) =>
      set((s) => {
        if (s.favouriteIds.has(id)) {
          s.favouriteIds.delete(id);
        } else {
          s.favouriteIds.add(id);
        }
      }),

    addToHistory: (id) =>
      set((s) => {
        s.historyIds = [id, ...s.historyIds.filter((h) => h !== id)].slice(0, 100);
      }),

    clearHistory: () => set((s) => { s.historyIds = []; }),
  })),
);
