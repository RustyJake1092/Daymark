# Daymark for Android

This is an installable Android app that displays the planner bundled inside the app. It does not need a hosted website URL. The app stores events on this device in Android WebView local storage; it does not sync with the browser version or other devices.

## Build the APK

1. Install Android Studio on a computer with Android SDK Platform 35 and JDK 17. Android Studio can install these from SDK Manager.
2. Open this `android` folder as a project in Android Studio and let Gradle sync.
3. Choose **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
4. Find the debug APK at `app/build/outputs/apk/debug/app-debug.apk`.
5. Transfer the APK to the Android phone, open it, and approve installation when Android asks. Alternatively, with USB debugging enabled, run `adb install -r app/build/outputs/apk/debug/app-debug.apk` from this folder.

Android may ask you to allow installs from the file manager or browser used to open the APK. Only install APKs you trust.

## Current build status

The source project is prepared, but no APK has been generated in this workspace: it has no JDK or Android SDK and only about 168 MB of free disk space, which is not enough to install the build toolchain. Build it in Android Studio on a computer with the required SDK space, then transfer the APK to the phone.
