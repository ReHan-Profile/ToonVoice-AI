ToonVoice Studio Pro v2.6 — Updated source bundle

Android: Android/ToonVoice-Android
Windows: Windows/ToonVoice-Desktop
Third-party notices: THIRD-PARTY-NOTICES.txt

Android FFmpeg is now packaged locally in the APK via npm dependencies and a prebuild asset-copy script; runtime CDN URLs have been removed. Windows already bundles ffmpeg-static in the installer. Both MP4 export paths add title, artist, copyright, comment and encoder metadata and use higher-quality H.264/AAC settings.

Important: This source bundle does NOT contain trained neural AI model weights for real anime/cartoon video conversion, true 3D reconstruction, or neural voice conversion. Current visual styles remain traditional pixel/image-processing effects. Adding genuine models requires choosing specific model architectures and weights, checking redistribution licenses, and validating memory/performance on target devices. No APK/EXE was compiled or device-tested in this environment.

Android build: copy Android/ToonVoice-Android contents to the root of its own Git repository; GitHub Actions builds the APK. The npm prebuild step copies FFmpeg JS/WASM/worker assets into the Vite public folder so they are included in the APK.
Windows build: copy Windows/ToonVoice-Desktop contents to its own repository root; run npm install then npm run dist:win on Windows or use the included workflow.
