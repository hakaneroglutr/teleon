# Teleon — Geliştirme Ortamı Kurulum Rehberi

## Gereksinimler

| Araç | Versiyon | Kontrol |
|------|----------|---------|
| Node.js | 20 LTS+ | `node -v` |
| JDK | 17 (Temurin) | `java -version` |
| Android Studio | Hedgehog+ | — |
| Android SDK | API 34 | Android Studio SDK Manager |
| Android NDK | 26.x | Android Studio SDK Manager |
| Git | 2.x+ | `git --version` |

---

## 1. Projeyi Klonla / Aç

```bash
# ZIP'ten çıkart veya klonla
cd teleon
```

## 2. Bağımlılıkları Yükle

```bash
npm install
```

## 3. Android Ortam Değişkenleri

`~/.bashrc` veya `~/.zshrc` dosyasına ekle:

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk   # macOS
# veya
export ANDROID_HOME=$HOME/Android/Sdk           # Linux

export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

## 4. Emülatör Hazırla

Android Studio → Virtual Device Manager → Pixel 7 Pro, API 34

```bash
# Veya terminal'den listele
$ANDROID_HOME/emulator/emulator -list-avds
$ANDROID_HOME/emulator/emulator -avd Pixel_7_Pro_API_34
```

## 5. Uygulamayı Çalıştır

```bash
# Terminal 1 — Metro Bundler
npm start

# Terminal 2 — Android build
npx react-native run-android
```

---

## 6. Demo Sunucu

Uygulama ilk açılışta `bir.dance:8080` sunucusunu otomatik ekler.

Manuel eklemek için:
- **Sunucu:** `bir.dance`
- **Port:** `8080`
- **Kullanıcı:** `5YSDJSHNPR`
- **Şifre:** `MvfWcvj642`

---

## 7. Testleri Çalıştır

```bash
# Tüm unit testler
npm test

# Watch modu
npm test -- --watch

# Coverage
npm test -- --coverage
```

---

## 8. Release Build

```bash
# Keystore oluştur (ilk kez)
keytool -genkey -v \
  -keystore android/app/teleon-release.keystore \
  -alias teleon \
  -keyalg RSA -keysize 2048 -validity 10000

# gradle.properties'e ekle:
# TELEON_UPLOAD_STORE_FILE=teleon-release.keystore
# TELEON_UPLOAD_STORE_PASSWORD=<sifre>
# TELEON_UPLOAD_KEY_ALIAS=teleon
# TELEON_UPLOAD_KEY_PASSWORD=<sifre>

# Release APK
cd android && ./gradlew assembleRelease

# Play Store AAB
cd android && ./gradlew bundleRelease
```

---

## 9. Fastlane (Opsiyonel)

```bash
gem install fastlane

# Debug build
fastlane android debug

# Internal test'e yükle
fastlane android internal
```

---

## Yaygın Sorunlar

### Metro bundler "cannot find module" hatası
```bash
npm start -- --reset-cache
```

### Android build "SDK not found" hatası
```bash
# android/local.properties dosyası oluştur:
echo "sdk.dir=$ANDROID_HOME" > android/local.properties
```

### VLC native kütüphane bulunamıyor
```bash
cd android && ./gradlew clean && cd ..
npx react-native run-android
```

### Emülatör yavaş
ABI olarak sadece `x86_64` kullan:
```
# android/app/build.gradle
abiFilters "x86_64"  # sadece emülatör için
```

---

## Proje Yapısı

```
teleon/
├── android/          Native Android (Kotlin)
│   └── app/src/main/java/com/teleon/
│       ├── player/   VLC + ExoPlayer + MediaService
│       ├── database/ SQLite (15 tablo)
│       ├── TeleonPackage.kt
│       ├── MainApplication.kt
│       └── MainActivity.kt
├── src/
│   ├── screens/      12 ekran + MultiScreen + Catchup
│   ├── components/   player/, channel/, common/
│   ├── hooks/        useChannelLoader, useEPG, useFavourites...
│   ├── store/        Zustand stores (server, channel, player, settings)
│   ├── services/     XtreamService, M3UParser, StalkerService
│   ├── native/       TeleonPlayer.ts, TeleonDatabase.ts
│   ├── navigation/   AppNavigator + types
│   ├── config/       servers.ts, constants.ts
│   ├── theme/        colors, typography, spacing
│   └── utils/        helpers, usePlayer
├── fastlane/         CI/CD + Play Store
└── __tests__/        Unit testler
```
