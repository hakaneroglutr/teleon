// src/__tests__/channelStore.test.ts
import {useChannelStore} from '../store/channelStore';
import {Channel} from '../store/types';

const MOCK_CHANNELS: Channel[] = [
  {streamId: 1, num: 1, name: 'TRT 1',     streamUrl: 'http://ex.com/1.ts', logoUrl: '', categoryId: 'ulusal', categoryName: 'Ulusal', serverId: 1},
  {streamId: 2, num: 2, name: 'ATV',        streamUrl: 'http://ex.com/2.ts', logoUrl: '', categoryId: 'ulusal', categoryName: 'Ulusal', serverId: 1},
  {streamId: 3, num: 3, name: 'beIN Sports',streamUrl: 'http://ex.com/3.ts', logoUrl: '', categoryId: 'spor',   categoryName: 'Spor',   serverId: 1},
];

describe('channelStore', () => {
  beforeEach(() => {
    // Store'u sıfırla
    useChannelStore.setState({
      channels: [],
      categories: [],
      favouriteIds: new Set(),
      historyIds: [],
      selectedCategory: 'all',
      searchQuery: '',
      isLoading: false,
    });
  });

  test('kanalları store\'a yazar', () => {
    useChannelStore.getState().setChannels(MOCK_CHANNELS);
    expect(useChannelStore.getState().channels).toHaveLength(3);
  });

  test('favori ekler ve çıkarır', () => {
    const {toggleFavourite, favouriteIds} = useChannelStore.getState();
    toggleFavourite(1);
    expect(useChannelStore.getState().favouriteIds.has(1)).toBe(true);
    toggleFavourite(1);
    expect(useChannelStore.getState().favouriteIds.has(1)).toBe(false);
  });

  test('izleme geçmişine ekler', () => {
    useChannelStore.getState().addToHistory(1);
    useChannelStore.getState().addToHistory(2);
    useChannelStore.getState().addToHistory(1); // tekrar ekleme → başa geçmeli
    const history = useChannelStore.getState().historyIds;
    expect(history[0]).toBe(1);
    expect(history).toHaveLength(2);
  });

  test('kategori filtresi çalışır', () => {
    useChannelStore.getState().setChannels(MOCK_CHANNELS);
    useChannelStore.getState().setCategory('spor');
    const filtered = useChannelStore.getState().filteredChannels();
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('beIN Sports');
  });

  test('arama filtresi çalışır', () => {
    useChannelStore.getState().setChannels(MOCK_CHANNELS);
    useChannelStore.getState().setSearch('trt');
    const filtered = useChannelStore.getState().filteredChannels();
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('TRT 1');
  });

  test('tüm kategoriler "all" ile gösterilir', () => {
    useChannelStore.getState().setChannels(MOCK_CHANNELS);
    useChannelStore.getState().setCategory('all');
    useChannelStore.getState().setSearch('');
    const filtered = useChannelStore.getState().filteredChannels();
    expect(filtered).toHaveLength(3);
  });
});
