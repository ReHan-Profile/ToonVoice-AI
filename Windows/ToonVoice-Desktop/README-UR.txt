ToonVoice Studio Pro 2.6 — Windows

- FFmpeg native binary کو ffmpeg-static dependency کے ذریعے installer میں bundle کیا جاتا ہے؛ runtime پر CDN درکار نہیں۔
- MP4 H.264/AAC export quality کو CRF 18 / fast preset پر بہتر کیا گیا ہے۔
- Output میں title, artist, copyright, comment اور encoder metadata tags شامل کیے جاتے ہیں۔
- FFmpeg fallback میں بھی recorded EQ/level processing برقرار رہتی ہے۔

حدود:
- موجودہ visual styles classical image-processing filters ہیں، trained neural AI نہیں۔
- neural video/style/3D/voice model weights اس build میں شامل نہیں؛ ان کے انتخاب، license review اور runtime integration کی ضرورت ہے۔
- Windows installer build اور حقیقی Windows machine پر testing درکار ہے۔
