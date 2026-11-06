# Chroma Toons App (free build)

A **2D character animation studio** for Android — create characters, pose a rig,
build a keyframe timeline, lip‑sync from the mic, add camera effects and record
the screen.

This project is a **clean‑room, non‑Unity rebuild** of the earlier Unity 6.2
clone. The old project could not produce an APK on a phone (Unity Editor cannot
run on Termux/ARM), so Unity was removed entirely and the same app surface was
re‑implemented as a plain web app inside a tiny Android WebView shell. The APK
is still fully buildable — via **GitHub Actions** or a PC — just not on the phone.

> Unity? Gone. No `Assets/`, no `Packages/`, no game‑ci, no `UNITY_LICENSE`.
> Just `www/` (the app) + `android/` (the wrapper that makes it an APK).

---

## How it works

```
www/      the whole application: HTML + CSS + vanilla JS (no framework)
android/  Gradle Android app: a WebView that loads www/ from its assets
docs/     build + port notes
tools/    helper scripts (Termux one‑shot cloud build)
```

The `android/` module copies `www/` into the APK as an asset at build time
(Gradle task `syncWebApp`), loads it through `WebViewAssetLoader` at
`https://appassets.androidplatform.net/assets/index.html`, and exposes a small
`ChromaNative` JS bridge for saving files, listing the gallery, mic permission
and app exit. In a normal browser the app runs as-is (the bridge is optional).

---

## Free build

Everything is unlocked and there is nothing to buy:

- `PremiumManager.isPro = true` — all "Pro" features active
- `AdManager.adsEnabled = false` — **no ads at all**
- No billing, no watermark, unlimited recordings (cap 3600 s)

---

## App identity (kept identical to the original)

| Field        | Value |
|--------------|-------|
| package      | `bhootiyadreamstv.moboapp.chromatoons` |
| versionCode  | `187` |
| versionName  | `174` |
| label        | `Chroma Toons App` |
| blog feed    | `https://www.chromatoons.com/search/label/Characters?&max-results=5` |
| telegram     | `https://t.me/chromatoons` |
| privacy      | `https://www.chromatoons.com/p/privacy.html` |
| min / target SDK | 24 / 34 |

Same dark theme colours as the old Unity `Theme`: bg `#12141C`, surface
`#1C202C`, surfaceAlt `#262B3A`, accent `#FF6B35`, accent2 `#4CC2FF`,
text `#F2F4F8`, textDim `#9AA3B2`, success `#4CAF50`, danger `#E53935`.

---

## Screens

Bottom nav: **Home · Characters · Animate · Record · More**.
Panels also reachable from Home / Settings:

`home` `characters` `creator` `animate` `timeline` `recording` `gallery`
`blog` `premium` `settings` `help`

---

## Build the APK

You **cannot** build on this phone (no JDK/Gradle/Android SDK). Use one of:

1. **GitHub Actions (recommended, phone-friendly)** — push the repo, the
   workflow `.github/workflows/android.yml` builds and uploads the APK.
   See `docs/BUILD.md`.
2. **Android Studio / PC** — open the `android/` folder and run
   `assembleRelease`.

Full instructions, signing notes and the Termux helper are in
[`docs/BUILD.md`](docs/BUILD.md).
The mapping from the old Unity code to the new modules is in
[`docs/REPORT.md`](docs/REPORT.md).

---

## Not included

- The original app's DragonBones rigs / premium character art are **not** copied
  (this is a clean‑room rebuild). Import your own images from the Characters tab.
- No ads, no analytics, no billing SDKs — by design.
