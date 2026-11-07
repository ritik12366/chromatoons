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

The `android/` module packages `www/` into the APK as an asset
(`assets.srcDirs += ../www`, no copy task) and serves it from a tiny built-in
HTTP server on `http://127.0.0.1:<random>/`, so the page runs from a real
`http://` origin and `fetch`/storage/media all work. A small `ChromaNative`
JS bridge handles saving files, listing the gallery, the mic permission and
app exit. There are **no third-party dependencies** (no AndroidX) — the app
targets the platform SDK only, so the build never needs to download anything
beyond Gradle + the Android SDK itself. In a normal browser the app runs as-is
(the bridge is optional).

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

## Built-in characters & animations (works offline)

Nothing has to be downloaded or imported — the APK already contains everything.

**7 built-in characters** (`www/scripts/characters-lib.js`) are drawn on the fly
as SVG data URLs, so they work in the APK with no network:

`Toon Boy` `Toon Girl` `Robot` `Tom Cat` `Ninja` `Alien` `Ghost`

Open **Characters → Built-in Characters** and tap one (or *Add All Characters*).
Each one is a normal character entry with a 240×360 sprite, so it can be placed
in the scene, re-coloured in the Creator, or replaced with your own image at any
time.

**11 ready-made animations** (`www/scripts/anim-lib.js`) play live on the rig —
open **Animate → Animations**:

| Clip | Length | Clip | Length | Clip | Length |
|------|--------|------|--------|------|--------|
| 🧍 Idle | 2.0 s | 🚶 Walk | 1.3 s | 🏃 Run | 0.8 s |
| 🦘 Jump | 1.5 s | 👋 Wave | 1.3 s | 💃 Dance | 2.0 s |
| 🗣️ Talk | 1.5 s | 🥊 Punch | 1.0 s | 🦵 Kick | 1.1 s |
| 😠 Angry | 1.3 s | 😴 Sleep | 3.0 s | | |

Tap a clip to loop it, **Stop Animation** to return to your own pose, or
**Bake To Keyframes** to convert the clip into a real timeline you can edit,
scrub, save and export frame by frame.

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
  (this is a clean-room rebuild) — the 7 built-in SVG characters are original
  art made for this build. Import your own images from the Characters tab any
  time.
- No ads, no analytics, no billing SDKs — by design.