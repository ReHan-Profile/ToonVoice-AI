import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
(()=>{'use strict';
const $=id=>document.getElementById(id), video=$('sourceVideo'), canvas=$('outputCanvas'), ctx=canvas.getContext('2d',{alpha:false}), off=document.createElement('canvas'), ox=off.getContext('2d',{willReadFrequently:true});
let style='original',fmt='original',voice='normal',url=null,raf=0,recording=false,rec=null,chunks=[],audioCtx=null,mediaSource=null,filters={},lastBlob=null,lastMime='',lastDraw=0,recStart=0,recTimer=null,stopTimer=null,renderStream=null,ffmpegInstance=null,renderBusy=false;
const clamp=(v,a=0,b=255)=>Math.max(a,Math.min(b,v)), time=t=>!isFinite(t)?'00:00':String(Math.floor(t/60)).padStart(2,'0')+':'+String(Math.floor(t%60)).padStart(2,'0');
function status(s){$('statusMsg').textContent=s} function log(s){$('debugBox').textContent=s}
function cropInfo(){const vw=video.videoWidth||640,vh=video.videoHeight||360,ar=vw/vh;let target=fmt==='9:16'?9/16:fmt==='1:1'?1:fmt==='16:9'?16/9:ar;let sx=0,sy=0,sw=vw,sh=vh;if(ar>target){sw=vh*target;sx=(vw-sw)/2}else{sh=vw/target;sy=(vh-sh)/2}const maxW=+( $('resolution').value||720),scale=Math.min(1,maxW/sw);return {sx,sy,sw,sh,w:Math.max(2,Math.round(sw*scale)),h:Math.max(2,Math.round(sh*scale))}}
function setupCanvas(){if(!video.videoWidth)return;const c=cropInfo();canvas.width=c.w;canvas.height=c.h;const procScale=Math.min(1,1080/c.w,Math.sqrt(2073600/(c.w*c.h)));off.width=Math.max(2,Math.round(c.w*procScale));off.height=Math.max(2,Math.round(c.h*procScale));drawFrame()}
function applyPixelStyle(){const w=off.width,h=off.height,img=ox.getImageData(0,0,w,h),d=img.data,src=new Uint8ClampedArray(d),edge=+$('edgeSlider').value/100,detail=+$('sketchSlider').value/100,contrast=+$('contrastSlider').value/100,bright=+$('brightSlider').value/100,sat=+$('colorSlider').value/100;
// Base color correction and per-style palette quantization.
for(let i=0;i<d.length;i+=4){let r=src[i],g=src[i+1],b=src[i+2];let y=.2126*r+.7152*g+.0722*b;let avg=(r+g+b)/3;r=avg+(r-avg)*1;g=avg+(g-avg)*1;b=avg+(b-avg)*1;
if(style==='toon2d'||style==='anime'||style==='comic'||style==='oil'){const levels=style==='anime'?5:style==='comic'?4:style==='oil'?7:6;r=Math.round(clamp(r)/255*(levels-1))*255/(levels-1);g=Math.round(clamp(g)/255*(levels-1))*255/(levels-1);b=Math.round(clamp(b)/255*(levels-1))*255/(levels-1)}
if(style==='sketch'||style==='noir'){r=g=b=y*(style==='sketch'?.95:1)}if(style==='retro'){r=clamp(r*1.08+18);g=clamp(g*1.02+7);b=clamp(b*.88)}if(style==='neon'){r=clamp(r*1.25);g=clamp(g*.9);b=clamp(b*1.3)}if(style==='cinematic'){r=clamp(r*1.06+5);g=clamp(g*1.01);b=clamp(b*.94+3)}if(style==='dream'){r=clamp(r*1.08+8);g=clamp(g*1.05+5);b=clamp(b*1.08+8)}d[i]=clamp(r);d[i+1]=clamp(g);d[i+2]=clamp(b)}
// Edge map: local luminance difference, used as dark ink for toon/comic/anime/sketch.
if(edge>0&&(style==='toon2d'||style==='anime'||style==='comic'||style==='sketch'||style==='oil')){const strength=edge*(style==='comic'?2.3:style==='anime'?1.9:1.6);for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const p=(y*w+x)*4, lum=(k)=>.2126*src[k]+.7152*src[k+1]+.0722*src[k+2],gx=Math.abs(lum(p-4)-lum(p+4)),gy=Math.abs(lum(p-w*4)-lum(p+w*4)),v=(gx+gy)/255*strength;if(v>.12){const ink=style==='anime'?Math.max(0,1-v*.95):Math.max(0,1-v);d[p]*=ink;d[p+1]*=ink;d[p+2]*=ink}}}
if(style==='sketch'){for(let i=0;i<d.length;i+=4){let v=(d[i]+d[i+1]+d[i+2])/3;v=clamp((255-v)*(0.6+detail*1.5));d[i]=d[i+1]=d[i+2]=v}}
if(style==='comic'){for(let i=0;i<d.length;i+=4){const k=(i/4)%w;if(k%2===0){d[i]*=.97;d[i+1]*=.97;d[i+2]*=.97}}}
ox.putImageData(img,0,0)}
function drawFrame(){if(video.readyState<2||!video.videoWidth)return;const c=cropInfo();if(canvas.width!==c.w||canvas.height!==c.h){canvas.width=c.w;canvas.height=c.h;const procScale=Math.min(1,1080/c.w,Math.sqrt(2073600/(c.w*c.h)));off.width=Math.max(2,Math.round(c.w*procScale));off.height=Math.max(2,Math.round(c.h*procScale))}const stab=$('aiStabilize').checked?Math.min(3,Math.max(0,Math.sin(video.currentTime*2)*1.5)):0;ox.clearRect(0,0,off.width,off.height);let filtersCss=[];if($('aiEnhance').checked)filtersCss.push('brightness(1.05)','contrast(1.08)','saturate(1.08)');if($('aiFace').checked)filtersCss.push('brightness(1.07)');if($('aiContrast').checked)filtersCss.push('contrast(1.12)');filtersCss.push(`brightness(${$('brightSlider').value/100})`,`contrast(${$('contrastSlider').value/100})`,`saturate(${$('colorSlider').value/100})`);if(+$('softSlider').value>0)filtersCss.push(`blur(${$('softSlider').value}px)`);ox.filter=filtersCss.join(' ');ox.drawImage(video,c.sx+stab,c.sy+stab,c.sw-stab*2,c.sh-stab*2,0,0,off.width,off.height);ox.filter='none';if(ox.filter!=='none'){const tmp=document.createElement('canvas');tmp.width=off.width;tmp.height=off.height;tmp.getContext('2d').drawImage(off,0,0);ox.clearRect(0,0,off.width,off.height);ox.drawImage(tmp,0,0);ox.filter='none'}
if(style!=='original'&&style!=='cinematic'&&style!=='watercolor'&&style!=='neon'&&style!=='retro'&&style!=='dream')applyPixelStyle();else{if(style==='cinematic')ox.filter='contrast(1.12) saturate(1.12)';if(style==='watercolor')ox.filter='saturate(1.2) blur(.35px)';if(style==='neon')ox.filter='contrast(1.3) saturate(1.7)';if(style==='dream')ox.filter='brightness(1.08) saturate(1.15)';ox.drawImage(off,0,0);ox.filter='none'}
const sharp=+$('sharpSlider').value/100;if(sharp>0){const w=off.width,h=off.height,frame=ox.getImageData(0,0,w,h),src=frame.data,out=new Uint8ClampedArray(src),amount=sharp*.55;for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=(y*w+x)*4;for(let ch=0;ch<3;ch++){const blur=(src[i-4+ch]+src[i+4+ch]+src[i-w*4+ch]+src[i+w*4+ch])*.25;out[i+ch]=Math.max(0,Math.min(255,src[i+ch]+(src[i+ch]-blur)*amount));}}frame.data.set(out);ox.putImageData(frame,0,0)}
 ctx.clearRect(0,0,canvas.width,canvas.height);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(off,0,0,canvas.width,canvas.height);
if(style==='cinematic'){const grad=ctx.createLinearGradient(0,0,canvas.width,canvas.height);grad.addColorStop(0,'rgba(10,30,60,.10)');grad.addColorStop(.5,'rgba(255,180,90,.04)');grad.addColorStop(1,'rgba(5,10,30,.20)');ctx.fillStyle=grad;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.strokeStyle='rgba(255,255,255,.08)';ctx.lineWidth=Math.max(1,canvas.width/500);ctx.strokeRect(2,2,canvas.width-4,canvas.height-4)}if(style==='neon'){ctx.shadowColor='#f0f';ctx.shadowBlur=12;ctx.strokeStyle='rgba(255,0,220,.25)';ctx.lineWidth=3;ctx.strokeRect(2,2,canvas.width-4,canvas.height-4);ctx.shadowBlur=0}}
function tick(now){if(video.paused||video.ended){raf=0;return}const fps=+$('frameRate').value||30;if(now-lastDraw>=1000/fps){lastDraw=now;drawFrame();$('currentTimeText').textContent=time(video.currentTime);const end=+$('trimEnd').value;if(video.currentTime>=end-.04){if(recording)stopRecording();else{video.pause();$('playPauseBtn').textContent='▶ Play'}}}raf=requestAnimationFrame(tick)}
function startLoop(){cancelAnimationFrame(raf);lastDraw=0;raf=requestAnimationFrame(tick)}
video.addEventListener('play',()=>{if(!recording)startLoop()});video.addEventListener('pause',()=>{if(!recording){cancelAnimationFrame(raf);raf=0;drawFrame();}});video.addEventListener('seeked',drawFrame);
function ensureAudio(){if(audioCtx)return true;try{audioCtx=new(window.AudioContext||window.webkitAudioContext)();mediaSource=audioCtx.createMediaElementSource(video);const input=audioCtx.createGain(),highpass=audioCtx.createBiquadFilter(),bass=audioCtx.createBiquadFilter(),treble=audioCtx.createBiquadFilter(),compressor=audioCtx.createDynamicsCompressor(),delay=audioCtx.createDelay(.5),wet=audioCtx.createGain(),master=audioCtx.createGain(),dest=audioCtx.createMediaStreamDestination();highpass.type='highpass';highpass.frequency.value=35;highpass.Q.value=.7;bass.type='lowshelf';bass.frequency.value=180;treble.type='highshelf';treble.frequency.value=3500;delay.delayTime.value=.12;wet.gain.value=0;compressor.threshold.value=-20;compressor.knee.value=20;compressor.ratio.value=4;compressor.attack.value=.004;compressor.release.value=.22;mediaSource.connect(input);input.connect(highpass);highpass.connect(bass);bass.connect(treble);treble.connect(compressor);compressor.connect(master);master.connect(audioCtx.destination);master.connect(dest);treble.connect(delay);delay.connect(wet);wet.connect(master);filters={input,highpass,bass,treble,compressor,delay,wet,master,dest};return true}catch(e){status('Audio processing unavailable in this browser: '+e.message);return false}}
const presets={normal:{rate:0,low:0,high:0},kid:{rate:5,low:-2,high:5},girl:{rate:3,low:-1,high:4},boy:{rate:-2,low:4,high:-1},oldman:{rate:-4,low:3,high:-3},oldwoman:{rate:1,low:1,high:2},bear:{rate:-6,low:7,high:-4},chipmunk:{rate:7,low:-3,high:6}};
function updateAudio(){ensureAudio();const p=+$('pitchSlider').value,pr=presets[voice]||presets.normal;if(filters.bass){filters.bass.gain.value=+$('bassSlider').value+pr.low+($('bassBoost').checked?5:0);filters.treble.gain.value=+$('trebleSlider').value+pr.high;filters.master.gain.value=+$('volumeSlider').value/100;filters.compressor.threshold.value=$('dolbyOn').checked?-20:0;filters.compressor.ratio.value=$('dolbyOn').checked?4:1;filters.wet.gain.value=$('echoOn').checked?.12:0;filters.highpass.frequency.value=$('noiseClean').checked?100:35;}video.playbackRate=1;$('pitchVal').textContent=(p>0?'+':'')+p+' semitones (MP4 export)';$('volumeVal').textContent=$('volumeSlider').value+'%';$('bassVal').textContent=$('bassSlider').value+' dB';$('trebleVal').textContent=$('trebleSlider').value+' dB'}
async function play(){if(!video.src)return;ensureAudio();if(audioCtx?.state==='suspended')await audioCtx.resume();const s=+$('trimStart').value,e=+$('trimEnd').value;if(video.currentTime<s||video.currentTime>=e)video.currentTime=s;try{await video.play();$('playPauseBtn').textContent='Ⅱ Pause';startLoop()}catch(e){status('Tap Play again to allow browser playback.')}}
function pause(){video.pause();cancelAnimationFrame(raf);raf=0;$('playPauseBtn').textContent='▶ Play'}
let loadToken=0;
function loadFile(file){
 if(!file){status('No file selected. Please choose a video.');return;}
 const extOK=/\.(mp4|mov|m4v|webm|mkv|3gp|3g2)$/i.test(file.name||'');
 if(!(file.type||'').startsWith('video/')&&!extOK){status('This does not look like a video. Choose MP4, MOV, WebM or 3GP.');return;}
 if(file.size===0){status('The selected file is empty. Choose another video.');return;}
 if(recording)stopRecording();pause();const token=++loadToken;
 video.onloadedmetadata=null;video.onloadeddata=null;video.onerror=null;
 video.pause();video.removeAttribute('src');video.load();
 if(url){URL.revokeObjectURL(url);url=null;}
 if(lastBlob){lastBlob=null;}
 $('downloadContainer').classList.add('hidden');$('mp4Preview').pause?.();$('mp4Preview').removeAttribute('src');$('mp4Preview').load();$('mp4Preview').classList.add('hidden');
 $('emptyState').classList.add('hidden');$('fileInfo').textContent=`Opening: ${file.name} • ${(file.size/1024/1024).toFixed(1)} MB`;
 $('controlsPanel').style.opacity=.55;$('controlsPanel').style.pointerEvents='none';status('Opening video…');
 const objectUrl=URL.createObjectURL(file);url=objectUrl;
 let ready=false;const fail=(message)=>{if(token!==loadToken)return;status(message);$('fileInfo').textContent='Video could not be opened. Try MP4 (H.264 video + AAC audio).';$('controlsPanel').style.opacity=.45;$('controlsPanel').style.pointerEvents='none';};
 const onReady=()=>{if(token!==loadToken||ready)return;if(!Number.isFinite(video.duration)||video.duration<=0)return;ready=true;
  video.currentTime=0;$('controlsPanel').style.opacity=1;$('controlsPanel').style.pointerEvents='auto';$('sourceVideo').classList.remove('hidden');$('outputCanvas').classList.remove('hidden');
  const d=video.duration;$('durationText').textContent=time(d);$('trimStart').max=d;$('trimEnd').max=d;$('trimStart').value=0;$('trimEnd').value=d;$('trimStartLabel').textContent='0.0s';$('trimEndLabel').textContent=d.toFixed(1)+'s';
  setupCanvas();$('fileInfo').textContent=`Loaded: ${file.name} • ${(file.size/1024/1024).toFixed(1)} MB`;
  log(`${video.videoWidth} × ${video.videoHeight} • ${d.toFixed(1)} sec`);status('Video loaded. Press Play to preview.');
 };
 video.addEventListener('loadedmetadata',onReady,{once:true});
 video.addEventListener('loadeddata',()=>{if(token===loadToken){onReady();drawFrame();}},{once:true});
 video.addEventListener('canplay',()=>{if(token===loadToken)onReady();},{once:true});
 video.addEventListener('error',()=>{const code=video.error?.code;fail(`Video decode failed (media error ${code||'unknown'}). Try MP4 H.264 + AAC; some phone codecs are unsupported.`);},{once:true});
 video.src=objectUrl;video.load();
 // Some Android document providers dispatch metadata slowly or not at all; surface a useful timeout.
 window.setTimeout(()=>{if(token===loadToken&&!ready)fail('Video is taking too long to open. Check file access and try a smaller MP4.');},15000);
}
$('videoUpload').onchange=e=>{loadFile(e.target.files?.[0]);e.target.value=''};$('videoUpload2').onchange=e=>{loadFile(e.target.files?.[0]);e.target.value=''};$('playPauseBtn').onclick=()=>video.paused?play():pause();$('restartBtn').onclick=()=>{video.currentTime=+$('trimStart').value;drawFrame()};$('testVoiceBtn').onclick=play;$('stopTestBtn').onclick=pause;
document.querySelectorAll('[data-style]').forEach(b=>b.onclick=()=>{style=b.dataset.style;document.querySelectorAll('[data-style]').forEach(x=>x.classList.toggle('active',x===b));drawFrame()});document.querySelectorAll('[data-fmt]').forEach(b=>b.onclick=()=>{fmt=b.dataset.fmt;document.querySelectorAll('[data-fmt]').forEach(x=>x.classList.toggle('active',x===b));setupCanvas()});document.querySelectorAll('[data-voice]').forEach(b=>b.onclick=()=>{voice=b.dataset.voice;document.querySelectorAll('[data-voice]').forEach(x=>x.classList.toggle('active',x===b));const p=presets[voice];$('pitchSlider').value=p.rate;updateAudio();status('Voice preset selected. Video speed stays normal; pitch is applied during MP4 export.')});
const ranges=[['edgeSlider','edgeVal','%'],['colorSlider','colorVal','%'],['sketchSlider','sketchVal','%'],['sharpSlider','sharpVal','%'],['brightSlider','brightVal','%'],['contrastSlider','contrastVal','%'],['softSlider','softVal',''],['pitchSlider','pitchVal',''],['volumeSlider','volumeVal','%'],['bassSlider','bassVal',' dB'],['trebleSlider','trebleVal',' dB']];ranges.forEach(([id,label,suffix])=>$(id).oninput=()=>{if(id==='pitchSlider'||id==='volumeSlider'||id==='bassSlider'||id==='trebleSlider')updateAudio();else{ $(label).textContent=$(id).value+suffix;drawFrame()}});
['aiEnhance','aiFace','aiContrast','aiStabilize'].forEach(id=>$(id).onchange=drawFrame);['dolbyOn','bassBoost','noiseClean','echoOn'].forEach(id=>$(id).onchange=updateAudio);$('resolution').onchange=setupCanvas;$('frameRate').onchange=()=>{if(!video.paused)startLoop()};
$('trimStart').oninput=()=>{let s=+$('trimStart').value,e=+$('trimEnd').value;if(s>=e-.1){s=Math.max(0,e-.1);$('trimStart').value=s}$('trimStartLabel').textContent=s.toFixed(1)+'s';video.currentTime=s;$('currentTimeText').textContent=time(s);drawFrame()};$('trimEnd').oninput=()=>{let s=+$('trimStart').value,e=+$('trimEnd').value;if(e<=s+.1){e=Math.min(video.duration,s+.1);$('trimEnd').value=e}$('trimEndLabel').textContent=e.toFixed(1)+'s'};
function supportedMime(){for(const m of ['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'])if(window.MediaRecorder?.isTypeSupported(m))return m;return ''}
function cleanupRender(){clearInterval(recTimer);clearTimeout(stopTimer);recTimer=stopTimer=null;$('renderBadge').classList.add('hidden');$('exportBtn').classList.remove('hidden');$('stopBtn').classList.add('hidden');$('exportBtn').disabled=false}
async function saveMp4ToAndroid(mp4Blob){
 const fileName=`ToonVoice_${new Date().toISOString().replace(/[:.]/g,'-')}.mp4`;
 // Capacitor native file save: write into Documents, then open Android share sheet.
 try{
  const cap=window.Capacitor;
  if(cap?.isNativePlatform?.()){
   const [{Filesystem,Directory},{Share}]=await Promise.all([import('@capacitor/filesystem'),import('@capacitor/share')]);
   const dataUrl=await new Promise((resolve,reject)=>{const fr=new FileReader();fr.onerror=()=>reject(new Error('Could not read rendered MP4'));fr.onload=()=>resolve(String(fr.result).split(',')[1]||'');fr.readAsDataURL(mp4Blob)});
   const saved=await Filesystem.writeFile({path:`ToonVoice/${fileName}`,data:dataUrl,directory:Directory.Documents,recursive:true});
   await Share.share({title:'ToonVoice MP4',text:'Rendered video saved in Documents/ToonVoice.',url:saved.uri,dialogTitle:'Save or share your MP4'});
   status('MP4 saved to Documents/ToonVoice. Android share sheet opened.');return true;
  }
 }catch(err){status('Android folder save failed: '+(err?.message||err)+'. Trying the system download instead.');}
 // Browser fallback for preview builds / PWA.
 const u=URL.createObjectURL(mp4Blob);const a=document.createElement('a');a.href=u;a.download=fileName;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),120000);status('MP4 download requested. Check the Downloads folder.');return true;
}
async function convertAndDownloadMp4(webmBlob){
 const btn=$('exportBtn');status('Converting render to MP4 (H.264/AAC)…');$('downloadContainer').classList.add('hidden');
 try{
  if(webmBlob.size>80*1024*1024)throw new Error('This render is over 80 MB. Android WebView may run out of memory; shorten the clip or choose 480p/720p.');
  if(!ffmpegInstance){ffmpegInstance=new FFmpeg();ffmpegInstance.on('log',({message})=>{if(message)status(message.slice(-130));});ffmpegInstance.on('progress',({progress})=>status(`MP4 encoding… ${Math.max(0,Math.min(100,Math.round(progress*100)))}%`));
   const base=new URL('ffmpeg/',document.baseURI);
   await ffmpegInstance.load({coreURL:new URL('ffmpeg-core.js',base).href,wasmURL:new URL('ffmpeg-core.wasm',base).href,workerURL:new URL('worker.js',base).href});
  }
  const ff=ffmpegInstance;await ff.writeFile('toonvoice-input.webm',await fetchFile(webmBlob));
  // EQ, volume, compressor, echo and rumble filtering are already baked
  // into the captured Web Audio stream. Apply pitch only during MP4 muxing.
  const pitch=+$('pitchSlider').value,ratio=Math.pow(2,pitch/12),atempo=(1/ratio).toFixed(6);
  const audioFilters=[];if(pitch!==0)audioFilters.push(`asetrate=48000*${ratio.toFixed(6)},aresample=48000,atempo=${atempo}`);
  const args=['-i','toonvoice-input.webm','-map','0:v:0','-map','0:a:0?','-vf','format=yuv420p'];
  if(audioFilters.length)args.push('-af',audioFilters.join(','));
  args.push('-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','256k','-metadata','title=ToonVoice Studio Pro','-metadata','artist=ToonVoice Studio','-metadata','copyright=Copyright 2026 ToonVoice Studio','-metadata','comment=Created with ToonVoice Studio Pro','-metadata','encoder=ToonVoice Studio Pro','-movflags','+faststart','toonvoice-output.mp4');
  await ff.exec(args);
  const data=await ff.readFile('toonvoice-output.mp4');const mp4Blob=new Blob([data],{type:'video/mp4'});if(!mp4Blob.size)throw new Error('MP4 encoder returned an empty file. Please retry with a shorter clip.');
  lastBlob=mp4Blob;const mp4URL=URL.createObjectURL(mp4Blob);const preview=$('mp4Preview');if(preview.dataset.objectUrl)URL.revokeObjectURL(preview.dataset.objectUrl);preview.src=mp4URL;preview.dataset.objectUrl=mp4URL;preview.classList.remove('hidden');
  $('downloadContainer').classList.remove('hidden');$('downloadLink').textContent='Save MP4 to Android';$('downloadLink').onclick=async()=>{const b=$('downloadLink');b.disabled=true;try{await saveMp4ToAndroid(mp4Blob)}finally{b.disabled=false}};
  status(`MP4 ready • ${(mp4Blob.size/1024/1024).toFixed(1)} MB • H.264 video / AAC audio. Tap Save / Share MP4 to store it on Android.`);
  await ff.deleteFile('toonvoice-input.webm').catch(()=>{});await ff.deleteFile('toonvoice-output.mp4').catch(()=>{});
 }catch(e){try{ffmpegInstance?.terminate?.()}catch{}ffmpegInstance=null;status('MP4 export failed: '+(e?.message||e)+'. Your original video is still loaded. Retry conversion; if it fails again, use a shorter clip or lower resolution.');$('downloadContainer').classList.remove('hidden');$('downloadLink').textContent='Retry MP4 Conversion';$('downloadLink').onclick=()=>convertAndDownloadMp4(webmBlob);}
 finally{cleanupRender();btn.disabled=false;btn.textContent='⬇ Render & Save';renderBusy=false;}
}
function finishRender(){if(!chunks.length){renderBusy=false;cleanupRender();$('exportBtn').disabled=false;status('No video frames were captured. Please render again.');return}const temp=new Blob(chunks,{type:lastMime||'video/webm'});cleanupRender();convertAndDownloadMp4(temp)}
function stopRecording(){if(!recording)return;recording=false;pause();if(rec&&rec.state!=='inactive')rec.stop();else finishRender()}
$('exportBtn').onclick=async()=>{
 if(!video.src||recording||renderBusy){status('Load a video first, or wait for the current render to finish.');return;}const clipSeconds=(+$('trimEnd').value)-(+ $('trimStart').value);if(!Number.isFinite(clipSeconds)||clipSeconds<0.2){status('Trim range is too short or invalid. Set at least 0.2 seconds.');return;}if(clipSeconds>90){status('For reliable Android export, render clips up to 90 seconds at a time.');return;}renderBusy=true;const mime=supportedMime();if(!mime){renderBusy=false;status('This Android WebView does not support video recording. Update Android System WebView/Chrome, then retry.');return}
 ensureAudio();if(audioCtx?.state==='suspended')await audioCtx.resume();video.pause();video.playbackRate=1;video.currentTime=+$('trimStart').value;drawFrame();
 const fps=+$('frameRate').value;renderStream=canvas.captureStream(fps);if(filters.dest){const t=filters.dest.stream.getAudioTracks()[0];if(t)renderStream.addTrack(t)}chunks=[];lastMime=mime;
 try{rec=new MediaRecorder(renderStream,{mimeType:mime,videoBitsPerSecond:+$('resolution').value>=1080?12000000:8000000,audioBitsPerSecond:192000})}catch(e){renderBusy=false;renderStream?.getTracks().forEach(t=>t.stop());status('Could not start video encoder: '+e.message);return}
 rec.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data)};rec.onerror=e=>status('Recording error: '+(e.error?.message||'unknown'));rec.onstop=()=>{renderStream?.getTracks().forEach(t=>t.stop());renderStream=null;finishRender()};
 recording=true;$('exportBtn').disabled=true;$('exportBtn').textContent='Rendering…';$('stopBtn').classList.remove('hidden');$('renderBadge').classList.remove('hidden');recStart=Date.now();recTimer=setInterval(()=>$('renderTimer').textContent=Math.floor((Date.now()-recStart)/1000)+'s',500);rec.start(1000);
 try{await play()}catch(e){stopRecording();return}status('Rendering processed video/audio in real time. Avoid switching to sleep mode; long videos take approximately their playback duration.');
};$('stopBtn').onclick=stopRecording;
video.addEventListener('timeupdate',()=>{if(recording&&video.currentTime>=+$('trimEnd').value-.08)stopRecording();});
window.addEventListener('beforeunload',()=>{if(url)URL.revokeObjectURL(url);if(recording)stopRecording()});
})();
