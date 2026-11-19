const { app, BrowserWindow, ipcMain, dialog, protocol, net } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
const os = require('node:os');
const { spawn } = require('node:child_process');
const ffmpegPath = require('ffmpeg-static');
const { pathToFileURL } = require('node:url');

protocol.registerSchemesAsPrivileged([{ scheme: 'toonvoice', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }]);

function createWindow() {
  const win = new BrowserWindow({
    width: 1500, height: 950, minWidth: 1100, minHeight: 720,
    backgroundColor: '#080d1c',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  win.loadURL('toonvoice://app/app/index.html');
}

ipcMain.handle('toonvoice:save-mp4', async (_event, payload) => {
  const arrayBuffer = payload?.buffer;
  const pitch = Math.max(-8, Math.min(8, Number(payload?.pitch) || 0));
  if (!(arrayBuffer instanceof ArrayBuffer) || arrayBuffer.byteLength === 0) {
    return { error: 'Render data खाली है। पहले वीडियो render करें।' };
  }
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Save ToonVoice MP4',
    defaultPath: path.join(app.getPath('videos'), 'ToonVoice_Studio.mp4'),
    filters: [{ name: 'MP4 Video', extensions: ['mp4'] }]
  });
  if (canceled || !filePath) return { canceled: true };
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'toonvoice-'));
  const input = path.join(tempDir, 'render.webm');
  try {
    await fs.writeFile(input, Buffer.from(arrayBuffer));
    // EQ, volume, compressor, echo and rumble filtering are already baked
    // into the captured Web Audio stream. Only apply pitch here.
    const factor = Math.pow(2, pitch / 12);
    const runEncoder = (audioFilter) => new Promise((resolve, reject) => {
      const args = [
        '-hide_banner', '-y', '-i', input,
        '-map', '0:v:0', '-map', '0:a:0?',
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '18',
        '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '256k',
        '-metadata', 'title=ToonVoice Studio Pro',
        '-metadata', 'artist=ToonVoice Studio',
        '-metadata', 'copyright=Copyright 2026 ToonVoice Studio',
        '-metadata', 'comment=Created with ToonVoice Studio Pro',
        '-metadata', 'encoder=ToonVoice Studio Pro',
        ...(audioFilter ? ['-af', audioFilter] : []),
        '-movflags', '+faststart', filePath
      ];
      const child = spawn(ffmpegPath, args, { windowsHide: true });
      let stderr = '';
      child.stderr.on('data', d => { stderr += d.toString(); if (stderr.length > 12000) stderr = stderr.slice(-12000); });
      child.on('error', reject);
      child.on('close', code => code === 0 ? resolve() : reject(new Error(stderr.slice(-1800) || `FFmpeg exit ${code}`)));
    });
    let pitchApplied = pitch === 0;
    try {
      const audioFilter = pitch ? `rubberband=pitch=${factor.toFixed(6)}` : '';
      await runEncoder(audioFilter);
      pitchApplied = true;
    } catch (err) {
      await fs.rm(filePath, { force: true }).catch(() => {});
      if (!pitch) throw err;
      // Some FFmpeg builds omit librubberband. Still deliver a valid MP4; the recorded audio already contains the EQ and level processing.
      await runEncoder('');
    }
    return { saved: true, path: filePath, pitchApplied };
  } catch (error) {
    await fs.rm(filePath, { force: true }).catch(() => {});
    return { error: error.message };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
});

app.whenReady().then(() => {
  protocol.handle('toonvoice', (request) => {
    const url = new URL(request.url);
    const filePath = path.resolve(__dirname, '.' + decodeURIComponent(url.pathname));
    if (!filePath.startsWith(path.resolve(__dirname) + path.sep)) return new Response('Not found', { status: 404 });
    return net.fetch(pathToFileURL(filePath).toString());
  });
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
