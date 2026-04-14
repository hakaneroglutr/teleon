# Teleon — IPTV & Medya Oynatıcı

Modern, açık kaynaklı IPTV ve medya oynatıcı uygulaması.  
AppForce Pro'nun tersine mühendislik analiziyle elde edilen mimari üzerine, React Native + Kotlin Native Modules kullanılarak sıfırdan inşa edilmiştir.

---

## Desteklenen Platformlar

| Platform | Durum      | Notlar                         |
|----------|------------|--------------------------------|
| Android  | ✅ Aktif    | minSdk 21 (Android 5.0+)      |
| iOS      | 🔜 Faz 6   | MobileVLCKit + AVFoundation    |

---

## Özellikler

- 📺 **Canlı TV** — Xtream Codes, M3U/M3U+, Stalker Portal
- 🎬 **VOD (Filmler)** — Kategori, arama, izleme geçmişi
- 🎭 **TV Serileri** — Sezon/bölüm takibi, devam ettirme
- 📅 **EPG (TV Rehberi)** — Günlük/haftalık program bilgisi
- ⭐ **Favoriler** — Kanal, film ve dizi favorileri
- ⊞ **Multi-screen** — Eş zamanlı çoklu akış görünümü
- 🎮 **İki Video Motoru** — VLC (libvlc) + ExoPlayer (Media3)
- 📲 **Picture-in-Picture** — Android 8.0+
- 🔄 **Arkaplan Oynatma** — Ekran kapalıyken devam

---

## Mimari

```
React Native (TypeScript)          ← Presentation + ViewModel
    │
    ├── Zustand Stores             ← State yönetimi
    ├── React Query                ← Server state + cache
    │
    ├── XtreamService.ts           ← Xtream Codes API
    ├── M3UParser.ts               ← M3U/M3U+ parser
    ├── StalkerService.ts          ← Stalker Portal
    │
    └── Native Köprüler
            │
            ├── TeleonPlayerModule.kt    ← VLC + ExoPlayer
            └── TeleonDatabaseModule.kt  ← SQLite (15 tablo)
```

---

## Hızlı Başlangıç

### Gereksinimler

| Araç | Versiyon |
|------|----------|
| Node.js | 20 LTS+ |
| JDK | 17 (Temurin) |
| Android Studio | Hedgehog+ |
| Android SDK | API 34 (target), API 21 (min) |
| Android NDK | 26.x |

### Kurulum

```bash
# 1. Bağımlılıkları yükle
npm install

# 2. Android uygulamayı başlat
npx react-native run-android

# 3. Metro bundler (ayrı terminal)
npm start
```

### İlk Çalıştırma

Uygulama açıldığında Sunucu Ekle ekranı gelir. Xtream Codes, M3U veya Stalker Portal bilgilerinizi girerek bağlanın.

---

## Proje Yapısı

```
teleon/
├── android/                         # Native Android
│   └── app/src/main/java/com/teleon/
│       ├── player/
│       │   └── TeleonPlayerModule.kt  # VLC + ExoPlayer native module
│       ├── database/
│       │   └── TeleonDatabaseModule.kt # SQLite (15 tablo)
│       ├── TeleonPackage.kt
│       ├── MainApplication.kt
│       └── MainActivity.kt
├── src/
│   ├── screens/                     # 12 ekran
│   │   ├── SplashScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── LiveTVScreen.tsx         ← Tam ✅
│   │   ├── MoviesScreen.tsx         ← Faz 4
│   │   ├── SeriesScreen.tsx         ← Faz 4
│   │   ├── EPGScreen.tsx            ← Faz 4
│   │   ├── FavoritesScreen.tsx      ← Faz 4
│   │   ├── PlayerScreen.tsx         ← Tam ✅
│   │   ├── AddServerScreen.tsx      ← Tam ✅
│   │   ├── SettingsScreen.tsx       ← Tam ✅
│   │   ├── SearchScreen.tsx         ← Faz 4
│   │   ├── VodDetailScreen.tsx      ← Faz 4
│   │   └── SeriesDetailScreen.tsx   ← Faz 4
│   ├── store/                       # Zustand stores
│   │   ├── types.ts
│   │   ├── serverStore.ts
│   │   ├── channelStore.ts
│   │   ├── playerStore.ts
│   │   └── settingsStore.ts
│   ├── services/                    # API servisleri
│   │   ├── XtreamService.ts         ← Tam ✅
│   │   ├── M3UParser.ts             ← Tam ✅
│   │   └── StalkerService.ts        ← Tam ✅
│   ├── native/                      # Native köprüler
│   │   ├── TeleonPlayer.ts          ← Tam ✅
│   │   └── TeleonDatabase.ts        ← Tam ✅
│   ├── navigation/
│   │   ├── types.ts
│   │   └── AppNavigator.tsx
│   └── theme/
│       ├── colors.ts
│       ├── typography.ts
│       └── spacing.ts
├── App.tsx
├── index.js
└── package.json
```

---

## Geliştirme Fazları

| Faz | Kapsam | Durum |
|-----|--------|-------|
| Faz 1 | Proje iskeleti, navigasyon, store, native modül stub | ✅ **Tamamlandı** |
| Faz 2 | VLC + ExoPlayer tam entegrasyon, PlayerScreen iyileştirme | 🔜 |
| Faz 3 | Kanal listesi yükleme, EPG entegrasyonu | 🔜 |
| Faz 4 | Tüm UI ekranları, VOD, Dizi, EPG canvas | 🔜 |
| Faz 5 | Test, optimizasyon, Play Store | 🔜 |
| Faz 6 | iOS (MobileVLCKit) | 🔜 |

---

## Veritabanı Şeması

APK analizinden çıkarılan orijinal şema:

| Tablo | İçerik |
|-------|--------|
| channels | Kanal listesi (server_id bazlı) |
| favourite | Canlı TV favorileri |
| vodfavourite | Film favorileri |
| seriesfavourite | Dizi favorileri |
| livechhistory | Canlı TV izleme geçmişi |
| vodhistory | Film izleme geçmişi |
| serieshistory | Dizi izleme geçmişi |
| servers | Xtream/Stalker sunucu listesi |
| fastcodePortal | Hızlı portal bağlantıları |
| recent | VOD izleme pozisyonu |
| recentChannel | Son izlenen kanallar |
| seriesseasonepisodeinfo | Dizi/sezon ilerleme |

---

## Lisans

MIT © 2025 Teleon Project
