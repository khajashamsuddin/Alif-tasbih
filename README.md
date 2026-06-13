# Sabr Tasbih

Sabr Tasbih is an elegant, distraction-free, and feature-rich Islamic Dhikr, Tasbih, and Dua companion application. Built using Flutter, it delivers a high-fidelity, production-ready experience across Android, iOS, Web (PWA), and Desktop (Windows/macOS/Linux) from a single codebase.

Designed with a premium "Emerald & Gold" Islamic aesthetic, Sabr Tasbih helps Muslims maintain daily remembrance of Allah through customizable counters, structured Duas, smart notification reminders, long-term Khatm project tracking, and an interactive, peaceful Dhikr Garden gamification system.

---

## 🌟 Key Features

*   **Core Tasbih Counter:**
    *   Tap anywhere on the large counter button with haptic vibration and click sounds.
    *   Target limits, progress rings, undo increments, and reset controls with double confirmations.
    *   Auto-save counters to prevent count loss across app Restarts.
*   **Dhikr & Dua Libraries:**
    *   Complete preloaded Dhikr library (morning, evening, Friday collections) and custom creators.
    *   Structured, JSON-based Dua database covering 20+ categories with Arabic, transliterations, and references.
    *   Global search, horizontal category filters, and bookmarking/favorites.
*   **Gamified Dhikr Garden:**
    *   A visually beautiful, non-competitive Alhambra-style virtual garden that levels up and sprouts trees, water features, and flowers as you recite.
*   **Streaks & Khatm Projects:**
    *   Milestones, active streak flames, and long-term Khatm trackers (e.g., 100k Durood) with auto-linked counters.
*   **Smart Reminders:**
    *   Set custom alarms (daily, weekly, Friday specials) that trigger local notifications pointing to specific dhikrs or duas.
*   **Offline-First & Cloud Sync:**
    *   Fully functional without internet (utilizing local Hive boxes). Syncs bidirectionally to Firebase Firestore when online.
*   **Data Portability:**
    *   Export analytics, settings, and counter logs directly into JSON or CSV formats.

---

## 🛠️ Technology Stack

*   **Frontend Framework:** Flutter & Material 3
*   **State Management:** Riverpod
*   **Local Database:** Hive (Key-Value fast storage)
*   **Backend & Sync:** Firebase Auth & Cloud Firestore
*   **Sensory Effects:** Audioplayers & Native Haptic Feedback
*   **Visual Charts:** fl_chart
*   **Notifications:** Flutter Local Notifications & Firebase Messaging
*   **PWA Assets:** Custom Service Worker and Manifest configurations

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the Flutter SDK and Dart installed on your system:
*   [Flutter SDK Installation Guide](https://docs.flutter.dev/get-started/install)
*   Java Development Kit (JDK) for Android builds.
*   Xcode for iOS/macOS compilation (macOS only).

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/sabr-tasbih.git
    cd sabr-tasbih
    ```
2.  Install dependencies:
    ```bash
    flutter pub get
    ```

### Running Locally

*   **Android Emulator / iOS Simulator:**
    ```bash
    flutter run
    ```
*   **Web Chrome Preview:**
    ```bash
    flutter run -d chrome
    ```
*   **Desktop Preview (Windows):**
    ```bash
    flutter run -d windows
    ```

---

## 📦 Production Builds & Deployment

### Android
*   Build a release APK (for manual installs):
    ```bash
    flutter build apk --release
    ```
*   Build an App Bundle (for Google Play Store upload):
    ```bash
    flutter build appbundle --release
    ```

### iOS
*   Build the iOS bundle for App Store Connect:
    ```bash
    flutter build ipa --release
    ```
    Then open the compiled archive in Xcode to complete signing and push to TestFlight.

### Web (PWA)
*   Compile to release web assets (utilizes PWA manifests and workers):
    ```bash
    flutter build web --release
    ```
*   Deploy to Firebase Hosting or GitHub Pages.

### Desktop (Windows)
*   Compile to native Windows binary:
    ```bash
    flutter build windows --release
    ```

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
