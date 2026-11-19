# ToonVoice Studio Pro — اردو رہنما

**ورژن:** 2.6.0  
**پلیٹ فارمز:** Android اور Windows

یہ repository دونوں پلیٹ فارمز کا الگ الگ source code رکھتی ہے۔ GitHub Actions کے ذریعے Android debug APK اور Windows installer بنائے جا سکتے ہیں۔

## اہم وضاحت

اس ورژن میں حقیقی neural AI anime/cartoon model weights، neural voice conversion weights یا true 3D reconstruction model شامل نہیں۔ موجودہ visual effects روایتی image/pixel processing پر مبنی ہیں۔ ان AI صلاحیتوں کا دعویٰ اس وقت تک نہ کریں جب تک اصل ماڈلز، ان کے runtime، لائسنس اور ڈیوائس ٹیسٹنگ شامل نہ ہو جائیں۔

## GitHub پر نئی repository بنانا

1. GitHub پر `ToonVoice-Studio-Pro` کے نام سے نئی repository بنائیں۔ ٹیسٹنگ کے دوران Private رکھنا بہتر ہے۔
2. ZIP extract کریں اور اس کے اندر موجود تمام فائلیں repository کے root میں upload/commit کریں۔ `.github` فولڈر لازماً root میں ہونا چاہیے۔
3. GitHub میں Actions کھولیں۔
4. `Build Android APK` منتخب کرکے `Run workflow` کریں۔ کامیاب ہونے پر Artifacts سے `ToonVoice-Android-debug-APK` حاصل کریں۔
5. Windows کے لیے `Build Windows Installer` چلائیں اور Artifacts سے installer حاصل کریں۔

## لانچ سے پہلے لازمی ٹیسٹ

- Android پر APK install اور launch ہو۔
- Windows 10/11 پر installer اور app درست کام کریں۔
- Video import، preview، effects اور MP4 export ٹیسٹ ہوں۔
- Audio sync اور آواز کے effects چیک ہوں۔
- MP4 میں Title، Artist، Copyright، Comment اور Encoder metadata چیک کریں۔
- Android پر install کے بعد airplane mode میں MP4 conversion آزمائیں۔
- مختلف ویڈیو دورانیوں اور resolutions پر memory اور stability چیک کریں۔

## کاپی رائٹ اور لائسنس

MP4 metadata میں ToonVoice Studio Pro کی شناخت اور copyright notice شامل ہے۔ یہ metadata کسی تیسرے فریق کے media، music، model یا software کی ملکیت ثابت نہیں کرتا۔ `THIRD-PARTY-NOTICES.txt` ضرور پڑھیں؛ FFmpeg اور دیگر dependencies کے درست license notices تقسیم سے پہلے شامل کرنا ضروری ہے۔

**اہم:** GitHub Actions سے حاصل ہونے والا Android APK فی الحال debug/test build ہے۔ عوامی لانچ سے پہلے signed release build، مکمل device testing، privacy/support معلومات اور تمام third-party license notices کی جانچ ضروری ہے۔
