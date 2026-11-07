# Port report — Unity build → non‑Unity build

## Why this exists

The previous project (`/storage/emulated/0/MT2/ChromaToonsClone`) was a Unity 6.2
C# clone of *Chroma Toons App* (`bhootiyadreamstv.moboapp.chromatoons`,
versionCode 187 / versionName 174). It could not produce an APK here because the
**Unity editor cannot run on Termux/ARM**. Per the request
("jesa vo hai vesa hi bas unity hata do"), Unity was removed and the same app
surface was rebuilt as a **web app + Android WebView wrapper**.

The old project was backed up to
`/storage/emulated/0/Download/ChromaToonsClone-unity-backup.tar.gz` before removal.

## File mapping (old Unity → new)

| Old Unity (C#, deleted) | New module |
|---|---|
| `Core/AppConfig.cs` | `www/scripts/core.js` → `AppConfig` |
| `Core/EventBus.cs` | `core.js` → `EventBus` |
| `Core/SaveSystem.cs` | `core.js` → `Store` (localStorage) |
| `Core/PremiumManager.cs` | `core.js` → `PremiumManager` (always pro) |
| `Core/AdManager.cs` | `core.js` → `AdManager` (ads off) |
| `Core/Localization.cs` | `core.js` → `Localization` (en/hi) |
| `Core/NetworkClient.cs` | `www/scripts/panels/blog.js` (`fetch` + `DOMParser`) |
| `Characters/CharacterStore.cs`, `CharacterData.cs` | `www/scripts/store.js` → `CharacterStore` |
| (project save) | `store.js` → `ProjectStore`, `Scene` |
| `Animation/AnimationStudio.cs`, `AnimationData.cs` | `www/scripts/studio.js` → `AnimationStudio` |
| `Rigging/BoneController.cs` | `www/scripts/animator.js` (parent→child bone hierarchy) |
| `Rigging/IKController.cs` | `www/scripts/rigging.js` (`solveTwoBone`, `lookAt`, `ccd`) |
| `Audio/AudioController.cs` | `www/scripts/audio.js` (`getUserMedia` + `AnalyserNode`) |
| `Audio/LipSyncController.cs` | `audio.js` (amplitude → `mouth.scaleY`, `speakText`) |
| `Effects/EffectsManager.cs` | `www/scripts/effects.js` (CSS filters + overlay) |
| `CameraRig/CameraController.cs` | `www/scripts/camera.js` (CSS transform pan/zoom/shake) |
| `Recording/ScreenRecorder.cs` | `www/scripts/recorder.js` (`MediaRecorder`) |
| `Recording/Permissions.cs` | `recorder.js` + `MainActivity` `onPermissionRequest` |
| `UI/UIFactory.cs`, `PanelBase.cs`, `PanelManager.cs` | `www/scripts/ui.js` |
| `UI/Theme.cs` | `www/styles/app.css` `:root` variables (same hex values) |
| `UI/AppBootstrap.cs` | `www/scripts/app.js` |
| `UI/Panels/HomePanel.cs` | `www/scripts/panels/home.js` |
| `UI/Panels/CharactersPanel.cs` | `www/scripts/panels/characters.js` |
| (Creator flow) | `www/scripts/panels/creator.js` + `www/scripts/creator.js` |
| `UI/Panels/TimelinePanel.cs` | `www/scripts/panels/timeline.js` |
| (Animate / BestBoneT) | `www/scripts/panels/animate.js` + `www/scripts/stage.js` |
| `UI/Panels/RecordingPanel.cs` | `www/scripts/panels/recording.js` |
| `UI/Panels/GalleryPanel.cs` | `www/scripts/panels/gallery.js` |
| `UI/Panels/BlogPanel.cs` | `www/scripts/panels/blog.js` |
| `UI/Panels/PremiumPanel.cs` | `www/scripts/panels/premium.js` |
| `UI/Panels/SettingsPanel.cs` | `www/scripts/panels/settings.js` |
| `UI/Panels/HelpPanel.cs` | `www/scripts/panels/help.js` |
| `Plugins/Android/AndroidManifest.xml` | `android/app/src/main/AndroidManifest.xml` |
| Unity scene / MonoBehaviour loop | `AnimationStudio` rAF clock + `Stage` canvas |

## What changed

- **Engine:** Unity scene + MonoBehaviours → a single HTML canvas renderer
  (`animator.js`) driven by `requestAnimationFrame`. The rig keeps a real
  parent→child hierarchy, so moving a bone moves its limbs.
- **UI:** Unity UGUI/uGUI panels → plain DOM built by `ui.js` helpers; the panel
  router keeps panels cached (`Panels.show(id)`).
- **Rendering of effects:** Unity post‑processing → CSS `filter` + overlay
  gradient on the stage.
- **Recording:** Unity `ScreenRecorder` → `MediaRecorder` over
  `canvas.captureStream(30)`, saved through the `ChromaNative` bridge to
  `Movies/ChromaToons` (videos) and `Pictures/ChromaToons` (images).
- **Animation data:** Unity `AnimationData` asset → JSON projects in
  localStorage, exportable/importable from the Timeline panel.
- **Localization:** kept en/hi; only the tables carried over so far (some panels
  still show English strings).
- **Built-in content (new, this build):** `characters-lib.js` draws 7 ready-to-use
  characters as SVG data URLs at runtime, and `anim-lib.js` ships 11 procedural
  animation clips (idle/walk/run/jump/wave/dance/talk/punch/kick/anger/sleep)
  that drive the rig through `AnimationStudio`, and can be baked into real
  timeline keyframes. Both are offline-only — no assets to download, no network.

## Preserved exactly

- Package `bhootiyadreamstv.moboapp.chromatoons`, versionCode `187`,
  versionName `174`, label `Chroma Toons App`.
- Blog feed URL, telegram, privacy, rate URLs.
- Theme hex colours (see `README.md`).
- Free stance: `isPro = true`, ads disabled, no billing.

## Not ported / differences

- **DragonBones mesh rigs and the original premium character art are not
  copied** — this is a clean-room rebuild. The 7 built-in SVG characters are
  original art written for this build; users can still import their own PNGs.
- The Unity‑specific editor tooling (`Assets/Editor/*`), `tools/build-termux.sh`
  for Unity, and the game‑ci workflow are gone; replaced by the web build and
  `.github/workflows/android.yml`.
- No ads/analytics/billing SDKs at all.

## Known gaps / follow‑ups

- `www/scripts/panels/timeline.js` has a dead reassignment at the end of
  `refreshKeys()` (`dur = studio.project.durationFrames;`) — harmless.
- `www/scripts/stage.js` appends the REC badge twice (second is a no‑op).
- Localization table coverage is partial.
- IK buttons solve an arm rotation but do not pin a draggable target yet.