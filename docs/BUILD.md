# Building the APK

The APK is a plain Android app (`android/`) that packages the web app
(`www/`). No Unity is involved.

> **This phone cannot build it.** Termux/ARM has no JDK, Gradle or Android SDK.
> Use GitHub Actions or a PC — details below.

---

## Option 1 — GitHub Actions (phone friendly) ⭐

The workflow `.github/workflows/android.yml` runs on `ubuntu-latest` with
JDK 17 + Gradle 8.7, syntax‑checks the web scripts, generates the Gradle
wrapper, builds a **release** APK and uploads it as an artifact.

1. Create an empty GitHub repo (e.g. `chromatoons`).
2. Push this project to it:
   ```sh
   git init
   git add .
   git commit -m "Chroma Toons free build (non-Unity)"
   git branch -M main
   git remote add origin https://github.com/<you>/chromatoons.git
   git push -u origin main
   ```
3. GitHub → **Actions** → *Build Android APK* → the push already triggered it.
   (Or use **Run workflow** to start it manually.)
4. Open the finished run → **Artifacts** → download `chromatoons-apk` → unzip →
   install the `.apk` on your phone.

### Termux one‑shot helper

If you have git + gh + curl in Termux, `tools/build-termux.sh` does all of the
above in one command:

```sh
sh tools/build-termux.sh
```

It creates the repo, pushes, runs the workflow, waits for it, and downloads the
APK into `/sdcard/Download/ChromaToons-APK/`.

---

## Option 2 — Android Studio / any PC

Requirements: JDK 17, Android SDK (platform 34 + build‑tools 34).

```sh
cd android
./gradlew assembleRelease          # or assembleDebug
# output: app/build/outputs/apk/release/app-release.apk
```

If `gradlew` and `gradle/wrapper/gradle-wrapper.jar` are missing (they are not
committed), generate them once with a local Gradle:

```sh
cd android
gradle wrapper --gradle-version 8.7
```

Or just open the `android/` folder in Android Studio and press **Run / Build**.

---

## Signing

`android/app/build.gradle` signs the **release** build with the debug keystore
so it installs out of the box:

```gradle
release {
    signingConfig signingConfigs.debug
}
```

For a public release, create your own keystore and either:

- edit `build.gradle` to use a `signingConfigs.release { … }` block, or
- build an unsigned/bundle and sign it with `apksigner`/`jarsigner`.

Keep keystores out of git (already in `.gitignore`).

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `gradlew: not found` | run `gradle wrapper --gradle-version 8.7` in `android/` (CI does this automatically) |
| Gradle/SDK version error | the workflow pins Gradle 8.7 + JDK 17; match those locally |
| APK builds but page is blank | check that `www/index.html` and all `www/scripts/*.js` exist; `assets.srcDirs` points at the whole `www/` folder |
| Mic doesn't record | first mic use triggers the Android runtime permission dialog (`MainActivity` requests `RECORD_AUDIO` before granting the WebView request). Tap **Allow**. |
| "Recording not supported" | the device/WebView lacks `MediaRecorder`/`captureStream`; screenshots still work |
