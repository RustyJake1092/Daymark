# Daymark

Daymark is a student planner with a campus dashboard, weekly class schedule and countdown, attendance tracking, assignment and event deadlines, a focus timer, and a student budget tracker.

## Android app

The native Android project is in [`android/`](android/). It loads the planner bundled inside the APK, so the installed app does not need a website or internet connection to open.

To build and install it, follow [`android/README.md`](android/README.md). The debug APK is generated at `android/app/build/outputs/apk/debug/app-debug.apk` after building with Android Studio and Android SDK Platform 35.

Classes, attendance, tasks, focus sessions, and expenses are stored locally on the device and do not sync between devices.

## Browser version

Open [`index.html`](index.html) directly to use the planner in a browser. The web version can also be hosted over HTTPS as a PWA.
