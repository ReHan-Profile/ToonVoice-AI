# ToonVoice Studio Pro

**Version:** 2.6.0  
**Platforms:** Android (Capacitor) and Windows (Electron)  
**Project status:** Source bundle prepared; release builds and device testing are still required.

ToonVoice Studio Pro is a video/audio effects application with separate Android and Windows projects. This repository keeps both platform projects together while building them independently through GitHub Actions.

> **Important status note:** This release includes conventional image/pixel-processing visual effects and audio processing. It does **not** currently include trained neural model weights for genuine AI anime/cartoon video transformation, neural voice conversion, or true 3D reconstruction. Those capabilities must not be advertised as available until models, runtimes, licenses, and device tests are added.

## Repository layout

```text
.
├── Android/ToonVoice-Android/   # Capacitor + Vite Android app source
├── Windows/ToonVoice-Desktop/  # Electron Windows app source
├── .github/workflows/          # APK and Windows installer builds
├── THIRD-PARTY-NOTICES.txt     # Third-party component/license reminders
└── README.md
```

## Features and implementation notes

- Android and Windows have separate native packaging pipelines.
- Android MP4 conversion uses FFmpeg WebAssembly assets copied from npm dependencies into the web build; the app's conversion code points to local packaged assets rather than a runtime CDN URL.
- Windows packaging includes the `ffmpeg-static` dependency in the Electron application bundle.
- MP4 export uses H.264 video and AAC audio settings and writes application title, artist, copyright, comment, and encoder metadata.
- The v2.6 source includes the previously applied audio double-processing correction.
- Android rendering uses a bounded canvas size to reduce memory pressure.

Actual output quality and compatibility depend on device hardware, source media, codecs, and the final build. Always test exported files on target devices.

## Build Android APK with GitHub Actions

1. Create a **new repository** named `ToonVoice-Studio-Pro` (Private is recommended during testing).
2. Extract this ZIP. Upload/commit **all contents inside the extracted folder** to the repository root. The `.github` folder must be at the repository root.
3. Use the default branch `main` (or `master`).
4. Open **Actions → Build Android APK → Run workflow**. A push affecting `Android/ToonVoice-Android/**` also triggers the workflow.
5. When the run completes successfully, open the run's **Artifacts** section and download `ToonVoice-Android-debug-APK`.
6. Extract the artifact and install the APK on a test Android phone. Android may ask you to allow installation from the app you used to open the APK. Only install builds you created and trust.

The workflow installs Node.js and Java, installs npm dependencies, builds the web assets, generates the Capacitor Android project, syncs it, and builds a **debug APK**. A debug APK is for testing, not the final public release. A signed release APK/AAB and secure signing-key management are separate release tasks.

## Build Windows installer with GitHub Actions

1. In the same repository, open **Actions → Build Windows Installer → Run workflow**.
2. Wait for the Windows runner to complete `npm install` and `npm run dist:win`.
3. Download `ToonVoice-Windows-Installer` from the run's **Artifacts** section.
4. Test installation, launch, importing media, effects, export, and metadata on a Windows test machine.

The installer is generated for Windows x64 using Electron Builder / NSIS.

## Local development

### Android web app

```bash
cd Android/ToonVoice-Android
npm install
npm run dev
```

To generate/sync the native Android project (Android Studio and Android SDK required):

```bash
npm run build
npx cap add android   # only the first time in a fresh checkout
npx cap sync android
npx cap open android
```

### Windows desktop app

On Windows with Node.js 22 installed:

```powershell
cd Windows/ToonVoice-Desktop
npm install
npm start
npm run dist:win
```

The installer is written to `Windows/ToonVoice-Desktop/dist/`.

## Test checklist before launch

- [ ] Android debug APK installs and opens on the intended Android versions.
- [ ] Windows installer installs, launches, and uninstalls cleanly on Windows 10/11.
- [ ] Import common MP4/MOV/WebM media and verify error handling for unsupported files.
- [ ] Preview and exported video have matching effects and timing.
- [ ] Check audio sync, pitch, volume, EQ, and other enabled audio effects.
- [ ] Check H.264/AAC MP4 playback in more than one media player.
- [ ] Verify title, artist, copyright, comment, and encoder metadata with a media metadata inspector.
- [ ] Test short and longer clips at each advertised resolution; monitor memory and app stability.
- [ ] Confirm Android MP4 conversion works in airplane mode after installation (initial install/build still requires internet).
- [ ] Confirm Windows export works without relying on a CDN.
- [ ] Record device model, OS version, test media details, and any failures.

## AI models and future model integration

No neural model weights are bundled in v2.6. Before adding a model, document: model name/version, upstream source, exact license and redistribution permissions, model file hashes, runtime/dependencies, minimum RAM/storage, supported devices, and benchmark results. Keep large model files in a versioned release/download mechanism only when their licenses permit redistribution. Do not silently download model weights from unverified URLs.

## Copyright, metadata, and third-party licenses

MP4 metadata currently identifies the application as ToonVoice Studio Pro and includes the configured application copyright notice. Metadata is informational; it does not establish ownership of source footage, music, images, model weights, or third-party software. Users must have rights to the media they process.

Review [`THIRD-PARTY-NOTICES.txt`](THIRD-PARTY-NOTICES.txt) before distributing builds. FFmpeg licensing depends on the exact build configuration and enabled codecs. Include all required license texts and source/offers for the exact binaries distributed. Also review the licenses for Electron, Capacitor, Vite, FFmpeg.wasm, and all other dependencies.

This repository intentionally does not grant a public license to the application source. Add an explicit project license only after the owner decides the intended reuse and distribution terms.

## Version history

See the platform-specific `CHANGELOG-2.6.txt` and earlier changelog files in each platform folder.

## Support and bug reports

When reporting a bug, include platform, app version, device/Windows version, steps to reproduce, expected result, actual result, and (if possible) a small sample file that you have permission to share. Never include private media or personal information in a public issue.
