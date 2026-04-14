// src/store/serverStore.ts
import {create} from 'zustand';
import {immer} from 'zustand/middleware/immer';
import {Server} from './types';

interface ServerStore {
  servers:       Server[];
  activeServer:  Server | null;

  // Actions
  addServer:     (s: Omit<Server, 'id' | 'createdAt'>) => void;
  updateServer:  (id: number, patch: Partial<Server>) => void;
  removeServer:  (id: number) => void;
  setActive:     (id: number) => void;
  clearAll:      () => void;
}

let nextId = 1;

export const useServerStore = create<ServerStore>()(
  immer((set) => ({
    servers:      [],
    activeServer: null,

    addServer: (data) =>
      set((state) => {
        const newServer: Server = {
          ...data,
          id:        nextId++,
          createdAt: Date.now(),
        };
        state.servers.push(newServer);
        if (state.servers.length === 1) {
          state.activeServer = newServer;
        }
      }),

    updateServer: (id, patch) =>
      set((state) => {
        const idx = state.servers.findIndex((s) => s.id === id);
        if (idx !== -1) {
          Object.assign(state.servers[idx], patch);
          if (state.activeServer?.id === id) {
            Object.assign(state.activeServer, patch);
          }
        }
      }),

    removeServer: (id) =>
      set((state) => {
        state.servers = state.servers.filter((s) => s.id !== id);
        if (state.activeServer?.id === id) {
          state.activeServer = state.servers[0] ?? null;
        }
      }),

    setActive: (id) =>
      set((state) => {
        const found = state.servers.find((s) => s.id === id);
        if (found) state.activeServer = found;
      }),

    clearAll: () =>
      set((state) => {
        state.servers      = [];
        state.activeServer = null;
      }),
  })),
);
