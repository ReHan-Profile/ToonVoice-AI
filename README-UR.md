# ToonVoice Studio Pro

**GitHub Repository:** `ReHan-Profile/ToonVoice-AI`  
**ایپ ورژن:** 2.6.0  
**پلیٹ فارمز:** Android (Capacitor) اور Windows (Electron)  
**موجودہ حالت:** Source code شائع ہو چکا ہے۔ GitHub build workflows موجود ہیں؛ کامیاب APK/EXE builds اور اصل ڈیوائسز پر ٹیسٹنگ ابھی ضروری ہے۔

ToonVoice Studio Pro ویڈیو اور آڈیو effects کی ایپلی کیشن ہے۔ Android اور Windows کے الگ الگ پروجیکٹس اسی repository میں رکھے گئے ہیں اور GitHub Actions سے الگ build ہوتے ہیں۔

> **اہم وضاحت:** ورژن 2.6.0 میں عام image/pixel-processing visual effects اور audio processing شامل ہیں۔ حقیقی AI anime/cartoon video conversion، neural voice conversion یا true 3D reconstruction کے لیے trained neural model weights ابھی شامل نہیں۔ ان فیچرز کو اس وقت تک دستیاب نہ لکھیں جب تک اصل models، runtime، redistribution کی اجازت اور device testing مکمل نہ ہو۔

## Repository کی ترتیب

```text
.
├── Android/ToonVoice-Android/       # Android source
├── Windows/ToonVoice-Desktop/      # Windows source
├── .github/workflows/
│   ├── android-apk.yml              # Android debug APK build
│   └── windows-installer.yml        # Windows installer build
├── README.md
├── README-UR.md
├── README-START-HERE.txt
├── RELEASE-CHECKLIST.md
└── THIRD-PARTY-NOTICES.txt
```

## موجودہ implementation

- Android اور Windows کے الگ build workflows۔
- Android FFmpeg WebAssembly assets npm dependencies سے web build میں شامل ہوتے ہیں؛ conversion code runtime CDN URL کے بجائے packaged local assets استعمال کرنے کے لیے ترتیب دیا گیا ہے۔
- Windows Electron package میں `ffmpeg-static` dependency شامل ہے۔
- MP4 export میں H.264 video، AAC audio اور application title، artist، copyright، comment اور encoder metadata کی settings شامل ہیں۔
- Audio double-processing correction اور Android میں memory pressure کم کرنے کے لیے bounded canvas size شامل ہے۔

حتمی output quality اور compatibility device، source media، codecs اور build پر منحصر ہیں۔ ریلیز سے پہلے offline processing اور export quality کو اصل devices پر verify کرنا ضروری ہے۔

## Android APK بنانے کا طریقہ

1. [ToonVoice-AI GitHub Repository](https://github.com/ReHan-Profile/ToonVoice-AI) کھولیں۔
2. **Actions** ٹیب منتخب کریں۔
3. **Build Android APK** منتخب کریں۔
4. **Run workflow** دبائیں، branch `main` منتخب رکھیں اور تصدیق کریں۔
5. Workflow کامیاب ہونے پر اس run کو کھولیں اور `ToonVoice-Android-debug-APK` artifact ڈاؤن لوڈ کریں۔
6. Artifact extract کرکے debug APK اپنے test Android فون میں install کریں۔

یہ testing کے لیے **debug APK** ہے، عوامی ریلیز کے لیے signed APK/AAB نہیں۔ Signed release build اور signing key کو محفوظ رکھنے کا کام الگ مرحلہ ہے۔ پہلی build کے دوران GitHub runner کو dependencies ڈاؤن لوڈ کرنے کے لیے انٹرنیٹ درکار ہوگا۔

`main` یا `master` پر Android source یا Android workflow میں تبدیلی push کرنے سے بھی build خود شروع ہو سکتا ہے۔

## Windows installer بنانے کا طریقہ

1. Repository کا **Actions** ٹیب کھولیں۔
2. **Build Windows Installer** منتخب کریں۔
3. **Run workflow** دبائیں اور branch `main` منتخب رکھیں۔
4. Workflow مکمل ہونے پر `ToonVoice-Windows-Installer` artifact ڈاؤن لوڈ کریں۔
5. Windows کمپیوٹر پر installation، launch، media import، effects، export اور metadata ٹیسٹ کریں۔

یہ workflow Electron Builder/NSIS کے ذریعے Windows x64 installer بناتا ہے۔

## Local development

### Android

```bash
cd Android/ToonVoice-Android
npm install
npm run dev
```

Native Android project بنانے اور sync کرنے کے لیے Android Studio اور Android SDK درکار ہیں:

```bash
npm run build
npx cap add android   # fresh checkout میں صرف پہلی بار
npx cap sync android
npx cap open android
```

### Windows

Node.js 22 کے ساتھ PowerShell میں:

```powershell
cd Windows/ToonVoice-Desktop
npm install
npm start
npm run dist:win
```

Installer `Windows/ToonVoice-Desktop/dist/` میں بنے گا۔

## ریلیز سے پہلے ٹیسٹنگ

- [ ] Android debug APK target فون پر install اور launch ہو۔
- [ ] Windows installer Windows 10/11 پر install، launch اور uninstall ہو۔
- [ ] MP4/MOV/WebM import اور unsupported files کی error handling چیک ہو۔
- [ ] Preview اور exported video کے effects اور timing ایک جیسے ہوں۔
- [ ] Audio sync اور تمام enabled audio effects چیک ہوں۔
- [ ] H.264/AAC MP4 ایک سے زیادہ media players میں چلے۔
- [ ] Title، artist، copyright، comment اور encoder metadata verify ہو۔
- [ ] مختصر اور طویل clips، ہر advertised resolution پر test ہوں؛ memory اور stability دیکھی جائے۔
- [ ] Android install کے بعد airplane mode میں conversion test ہو۔
- [ ] Windows export کے لیے runtime CDN dependency نہ ہو۔
- [ ] Test device، OS version اور تمام failures کا ریکارڈ رکھا جائے۔

## AI Models کی موجودہ حیثیت

ورژن 2.6.0 میں trained neural model weights شامل نہیں ہیں۔ کوئی model شامل کرنے سے پہلے اس کا درست نام/version، اصل source، license اور redistribution permission، file hashes، runtime/dependencies، RAM/storage requirements، supported devices اور benchmark results درج کرنا ضروری ہے۔ غیر تصدیق شدہ model downloads شامل نہ کریں۔

## Copyright اور Third-party licenses

MP4 metadata میں ایپ کا نام ToonVoice Studio Pro اور configured application copyright information شامل ہوتی ہے۔ Metadata خود بخود input video، audio، images، model weights یا third-party software کی ملکیت ثابت نہیں کرتا۔ استعمال ہونے والے media کے حقوق صارف کے پاس ہونے چاہئیں۔

ریلیز سے پہلے `THIRD-PARTY-NOTICES.txt` پڑھیں۔ FFmpeg کا license اس کے exact build configuration اور enabled codecs پر منحصر ہو سکتا ہے۔ Electron، Capacitor، Vite، FFmpeg.wasm اور باقی dependencies کے licenses بھی verify کریں۔

اس repository میں application source کے لیے ابھی open-source license مقرر نہیں کیا گیا۔ Public repository ہونے کا مطلب یہ نہیں کہ کوئی بھی source کو اپنی مرضی سے reuse یا redistribute کر سکتا ہے۔

## Bug report

Issue بناتے وقت platform، app version، device/Windows version، مسئلہ دہرانے کے steps، expected result اور actual result لکھیں۔ Public issue میں private media یا ذاتی معلومات اپلوڈ نہ کریں۔
