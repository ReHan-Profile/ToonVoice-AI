ToonVoice Studio Pro 2.6 — Android

اہم اپ ڈیٹس:
- FFmpeg WebAssembly اور اس کا worker اب CDN سے نہیں بلکہ app package کے اندر public/ffmpeg سے load ہوتے ہیں۔
- npm run build سے پہلے prebuild script مقامی FFmpeg assets copy کرتی ہے؛ اسی لیے APK میں یہ فائلیں شامل ہوں گی۔
- MP4 H.264/AAC export میں بہتر quality settings اور title/artist/copyright/comment/encoder metadata شامل ہیں۔
- تمام video/audio processing فون پر ہوتی ہے؛ کسی cloud AI service کا دعویٰ نہیں کیا گیا۔

حدود:
- موجودہ toon/anime/sketch وغیرہ ابھی classical image-processing filters ہیں، trained neural AI models نہیں۔
- حقیقی neural style-transfer، frame-consistent video AI، 3D reconstruction اور neural voice conversion کے model weights اس source میں شامل نہیں؛ ان کے لیے منتخب models، قابلِ اجازت licenses، runtime اور بڑی model files درکار ہیں۔
- Android WebView memory اور device performance کے باعث بہت طویل/high-resolution renders محدود ہو سکتے ہیں۔
- APK/فون testing اس ماحول میں نہیں ہوئی؛ GitHub Actions سے build اور حقیقی device پر QA ضروری ہے۔
