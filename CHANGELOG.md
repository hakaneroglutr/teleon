# Teleon Değişiklik Günlüğü

## [1.0.0] — 2025-04 (Faz 3)

### Eklendi
- **Faz 1 — Proje İskeleti**
  - React Native 0.74 bare workflow
  - Zustand store'ları: server, channel, player, settings
  - Native köprüler: TeleonPlayer.ts, TeleonDatabase.ts
  - SQLite şeması: 15 tablo (APK analizinden)
  - Bottom Tab + Stack Navigator
  - Dark IPTV tema sistemi (colors, typography, spacing)

- **Faz 2 — Video Oynatıcı**
  - VLC SurfaceView native entegrasyonu (TeleonSurfaceView.kt)
  - React Native ViewManager köprüsü (TeleonPlayerViewManager.kt)
  - TeleonPlayerView bileşeni (VLC + ExoPlayer)
  - PlayerControls — yeniden kullanılabilir kontrol overlay
  - Gesture kontrolü: yatay seek, dikey ses/parlaklık
  - Tüm ekranlar: LiveTV, Movies, Series, EPG, Favorites, Search
  - useChannelLoader — Xtream/M3U/Stalker kanal yükleme
  - useEPG, useVodLoader, useSeriesLoader hook'ları
  - EPG canvas timeline (program başlıkları, canlı göstergesi)
  - SeriesDetailScreen — sezon/bölüm takibi

- **Faz 3 — Gerçek Veri & Özellikler**
  - Demo sunucu otomatik bağlantı (bir.dance:8080)
  - HomeScreen hero banner — otomatik döngü, EPG entegrasyonu
  - Multi-Screen modu — 2x2 eş zamanlı kanal
  - Catch-up TV — geçmiş yayınları izle
  - useAppInit — SQLite önbellek + arka plan yenileme
  - useFavourites — DB senkronizasyonu
  - useWatchHistory — VOD pozisyon kaydetme
  - TeleonEPGWorker — WorkManager ile 6 saatlik EPG yenilemesi
  - Uygulama ikonu (adaptive icon)
  - Fastlane CI/CD kurulumu
  - Unit testler: M3UParser, helpers, channelStore, XtreamService
  - SETUP.md rehberi

### Teknik Detaylar
- **Video motorları:** VLC 3.6 + ExoPlayer (Media3) 1.3
- **Protokoller:** Xtream Codes, M3U/M3U+, Stalker Portal
- **Streaming:** HLS, DASH, RTSP, RTMP, HTTP/TS
- **Android:** minSdk 21, targetSdk 34, Kotlin 1.9
- **State:** Zustand 4 + Immer
- **Cache:** SQLite (kanal listesi), MMKV (ayarlar)
