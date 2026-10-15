# Daymark for Android

This is an installable Android app with the student dashboard, class timetable and countdown, attendance tracker, assignment and event deadlines, focus timer, and budget tracker bundled inside the APK. It does not need a hosted website URL. Planner data is stored on this device in Android WebView local storage and does not sync with the browser version or other devices.

## Build the APK

1. Install Android Studio on a computer with Android SDK Platform 35 and JDK 17. Android Studio can install these from SDK Manager.
2. Open this `android` folder as a project in Android Studio and let Gradle sync.
3. Choose **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
4. Find the debug APK at `app/build/outputs/apk/debug/app-debug.apk`.
5. Transfer the APK to the Android phone, open it, and approve installation when Android asks. Alternatively, with USB debugging enabled, run `adb install -r app/build/outputs/apk/debug/app-debug.apk` from this folder.

Android may ask you to allow installs from the file manager or browser used to open the APK. Only install APKs you trust.

## Current build status

The GitHub Actions workflow builds a debug APK and attaches it to a prerelease whenever Android app files change on `main`. Open the repository's **Releases** page, download `app-debug.apk`, transfer it to the Android phone, then open the file to install. Android may ask you to allow installs from the app used to open the APK.
