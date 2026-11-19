# ToonVoice Studio Pro

**Repository:** `ReHan-Profile/ToonVoice-AI`  
**App version:** 2.6.0  
**Platforms:** Android (Capacitor) and Windows (Electron)  
**Status:** Source is published. GitHub build workflows are present; successful release builds and device testing are still required.

ToonVoice Studio Pro is a video/audio effects application with separate Android and Windows projects maintained in one repository. Each platform is built independently using GitHub Actions.

> **Current capability note:** Version 2.6.0 contains conventional image/pixel-processing visual effects and audio processing. It does not yet bundle trained neural model weights for genuine AI anime/cartoon video conversion, neural voice conversion, or true 3D reconstruction. Do not advertise those as available until the model files, runtimes, redistribution permissions, and device tests have been added.

## Repository structure

```text
.
├── Android/ToonVoice-Android/       # Capacitor + Vite Android source
├── Windows/ToonVoice-Desktop/      # Electron Windows source
├── .github/workflows/
│   ├── android-apk.yml              # Android debug APK workflow
│   └── windows-installer.yml        # Windows x64 installer workflow
├── README.md
├── README-UR.md
├── README-START-HERE.txt
├── RELEASE-CHECKLIST.md
└── THIRD-PARTY-NOTICES.txt
```

## Current implementation

- Separate Android and Windows build pipelines.
- Android FFmpeg WebAssembly assets are copied from npm dependencies into the web build; conversion code uses packaged local assets rather than a runtime CDN URL.
- Windows packaging uses the `ffmpeg-static` dependency in the Electron application bundle.
- MP4 export is configured for H.264 video and AAC audio and writes application title, artist, copyright, comment, and encoder metadata.
- The source includes the audio double-processing correction and a bounded Android canvas size to reduce memory pressure.

Actual output quality and compatibility depend on the device, source media, codecs, and build. The offline behavior and export quality must be verified on target devices before release.

## Build Android debug APK

1. Open this repository: [ToonVoice-AI](https://github.com/ReHan-Profile/ToonVoice-AI).
2. Select **Actions**.
3. Select **Build Android APK**.
4. Select **Run workflow** on branch `main` and confirm.
5. When the run completes, open it and download the `ToonVoice-Android-debug-APK` artifact.
6. Extract the artifact and install the debug APK on a test Android device.

The workflow installs Node.js and Java, installs npm dependencies, builds the web assets, generates/synchronizes the Capacitor Android project, and runs `assembleDebug`. This is a **debug/testing APK**, not a signed public release. A signed release APK/AAB and secure signing-key management are separate tasks.

A push to `main` or `master` that changes `Android/ToonVoice-Android/**` or the Android workflow file also triggers the workflow.

## Build Windows installer

1. Open this repository's **Actions** tab.
2. Select **Build Windows Installer**.
3. Select **Run workflow** on branch `main` and confirm.
4. When the run completes, download the `ToonVoice-Windows-Installer` artifact.
5. Test installation, launch, media import, effects, export, and metadata on a Windows test machine.

The workflow builds a Windows x64 installer using Electron Builder/NSIS. A push to `main` or `master` that changes `Windows/ToonVoice-Desktop/**` or the Windows workflow file also triggers it.

## Local development

### Android

```bash
cd Android/ToonVoice-Android
npm install
npm run dev
```

To generate and sync the native Android project (Android Studio and Android SDK required):

```bash
npm run build
npx cap add android   # only once in a fresh checkout
npx cap sync android
npx cap open android
```

### Windows

On Windows with Node.js 22 installed:

```powershell
cd Windows/ToonVoice-Desktop
npm install
npm start
npm run dist:win
```

The installer is written to `Windows/ToonVoice-Desktop/dist/`.

## Pre-release test checklist

- [ ] Android debug APK installs and opens on target Android versions.
- [ ] Windows installer installs, launches, and uninstalls on Windows 10/11.
- [ ] MP4/MOV/WebM import and unsupported-file handling work.
- [ ] Preview and exported video effects/timing match.
- [ ] Audio synchronization and enabled audio effects work correctly.
- [ ] H.264/AAC MP4 plays in more than one media player.
- [ ] Title, artist, copyright, comment, and encoder metadata are verified with a metadata inspector.
- [ ] Short and longer clips are tested at advertised resolutions; memory and stability are monitored.
- [ ] Android conversion works in airplane mode after installation (the initial build/install still needs network access).
- [ ] Windows export works without a runtime CDN dependency.
- [ ] Test device/OS details and failures are recorded.

## AI model integration status

No trained neural model weights are bundled in v2.6.0. Before integrating a model, document its exact name/version, upstream source, license and redistribution rights, file hashes, runtime/dependencies, RAM/storage requirements, supported devices, and benchmark results. Do not add model files or download links unless redistribution is permitted and the source is verified.

## Copyright, metadata, and third-party notices

MP4 metadata identifies the application as ToonVoice Studio Pro and includes the configured application copyright information. Metadata is informational; it does not establish ownership of input footage, audio, images, model weights, or third-party software. Users must have the rights needed to process and distribute their media.

Review [`THIRD-PARTY-NOTICES.txt`](THIRD-PARTY-NOTICES.txt) before distributing builds. FFmpeg licensing depends on the exact build configuration and enabled codecs. Include all required notices and source/offers for the exact binaries distributed. Also review the licenses for Electron, Capacitor, Vite, FFmpeg.wasm, and all other dependencies.

This repository currently does not declare an open-source license for the application itself. Do not assume that public visibility grants permission to reuse, modify, or redistribute the application. Add a project license only after the owner has chosen the intended terms.

## Reporting issues

When opening an issue, include platform, app version, device/Windows version, reproduction steps, expected behavior, actual behavior, and (if possible) a small sample file you have permission to share. Do not upload private media or personal information to public issues.
