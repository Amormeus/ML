const els = {
  slideA: document.getElementById('slideA'),
  slideB: document.getElementById('slideB'),
  ambient: document.getElementById('ambient'),
  counter: document.getElementById('counter'),
  captionMain: document.getElementById('captionMain'),
  captionSub: document.getElementById('captionSub'),
  progress: document.querySelector('#progress span'),
  interval: document.getElementById('interval'),
  intervalValue: document.getElementById('intervalValue'),
  randomToggle: document.getElementById('randomToggle'),
  effectToggle: document.getElementById('effectToggle'),
  effectPills: document.getElementById('effectPills'),
  thumbs: document.getElementById('thumbs'),
  playPause: document.getElementById('playPause'),
  prevBtn: document.getElementById('prevBtn'),
  nextBtn: document.getElementById('nextBtn'),
  shuffleBtn: document.getElementById('shuffleBtn'),
  fullscreenBtn: document.getElementById('fullscreenBtn'),
  openPanel: document.getElementById('openPanel'),
  closePanel: document.getElementById('closePanel'),
  panel: document.getElementById('panel'),
  fileInput: document.getElementById('fileInput'),
  addFilesBtn: document.getElementById('addFilesBtn'),
  dropzone: document.getElementById('dropzone'),
  driveFolder: document.getElementById('driveFolder'),
  driveApiKey: document.getElementById('driveApiKey'),
  loadDriveBtn: document.getElementById('loadDriveBtn'),
  driveStatus: document.getElementById('driveStatus')
};

const EFFECTS = [
  ['fade-in','Fade'], ['zoom','Zoom'], ['zoom-out','Zoom Out'],
  ['pan-left','Pan Left'], ['pan-right','Pan Right'], ['pan-up','Pan Up'], ['pan-down','Pan Down'],
  ['rotate','Rotate'], ['blur','Blur'], ['slice','Slice'], ['circle','Circle'],
  ['diamond','Diamond'], ['tilt','Tilt'], ['dissolve','Dissolve'], ['swing','Swing']
];

let images = [
  { src: 'images/01.jpg', title: 'Photo 01', sub: 'Demo collection' },
  { src: 'images/02.jpg', title: 'Photo 02', sub: 'Demo collection' },
  { src: 'images/03.jpg', title: 'Photo 03', sub: 'Demo collection' },
  { src: 'images/04.jpg', title: 'Photo 04', sub: 'Demo collection' },
  { src: 'images/05.jpg', title: 'Photo 05', sub: 'Demo collection' }
];

const DRIVE_STORAGE_KEY = 'galleryDriveConfig';
const savedDrive = JSON.parse(localStorage.getItem(DRIVE_STORAGE_KEY) || 'null');
if (savedDrive?.folder) els.driveFolder.value = savedDrive.folder;
if (savedDrive?.apiKey) els.driveApiKey.value = savedDrive.apiKey;

function extractDriveFolderId(value) {
  const v = String(value || '').trim();
  if (!v) return '';
  const m = v.match(/folders\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : (v.match(/^[a-zA-Z0-9_-]{10,}$/)?.[0] || '');
}

function driveImageUrl(id) {
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w2400`;
}

async function loadGoogleDriveImages() {
  const folderId = extractDriveFolderId(els.driveFolder.value);
  const apiKey = els.driveApiKey.value.trim();
  if (!folderId || !apiKey) {
    setDriveStatus('Cần Folder ID/link và Google Drive API Key.', 'err');
    return;
  }
  setDriveStatus('Đang đọc danh sách ảnh từ Google Drive…');
  els.loadDriveBtn.disabled = true;
  try {
    let pageToken = '';
    const found = [];
    do {
      const params = new URLSearchParams({
        q: `'${folderId}' in parents and trashed = false`,
        pageSize: '1000',
        fields: 'nextPageToken,files(id,name,mimeType)',
        key: apiKey
      });
      if (pageToken) params.set('pageToken', pageToken);
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
      (data.files || []).forEach(f => {
        if (f.mimeType?.startsWith('image/')) found.push({
          src: driveImageUrl(f.id),
          title: f.name.replace(/\.[^.]+$/, ''),
          sub: 'Google Drive'
        });
      });
      pageToken = data.nextPageToken || '';
    } while (pageToken);

    if (!found.length) throw new Error('Không tìm thấy ảnh. Kiểm tra quyền chia sẻ và thư mục.');
    images = found;
    current = 0; history = [];
    localStorage.setItem(DRIVE_STORAGE_KEY, JSON.stringify({ folder: els.driveFolder.value.trim(), apiKey }));
    showCurrent();
    preload();
    scheduleNext();
    setDriveStatus(`Đã tải ${images.length} ảnh từ Google Drive.`, 'ok');
  } catch (err) {
    setDriveStatus(`Lỗi: ${err.message}`, 'err');
  } finally {
    els.loadDriveBtn.disabled = false;
  }
}

function setDriveStatus(text, type = '') {
  els.driveStatus.textContent = text;
  els.driveStatus.className = `drive-status ${type}`;
}


let current = 0;
let previous = 0;
let showingA = true;
let timer = null;
let progressTimer = null;
let running = true;
let randomPhotos = true;
let randomEffects = true;
let selectedEffect = 'zoom';
let history = [];

const state = JSON.parse(localStorage.getItem('galleryState') || 'null') || {};
if (Number.isFinite(state.interval)) els.interval.value = state.interval;
if (state.randomPhotos === false) randomPhotos = false;
if (state.randomEffects === false) randomEffects = false;
if (state.selectedEffect) selectedEffect = state.selectedEffect;

function persist() {
  localStorage.setItem('galleryState', JSON.stringify({
    interval: Number(els.interval.value), randomPhotos, randomEffects, selectedEffect
  }));
}

function applyToggle(btn, on) {
  btn.classList.toggle('on', on);
  btn.setAttribute('aria-pressed', String(on));
}

applyToggle(els.randomToggle, randomPhotos);
applyToggle(els.effectToggle, randomEffects);
els.intervalValue.textContent = els.interval.value;

function renderEffectPills() {
  els.effectPills.innerHTML = EFFECTS.map(([key, name]) =>
    `<button class="pill ${selectedEffect === key ? 'active' : ''}" data-effect="${key}">${name}</button>`
  ).join('');
}
renderEffectPills();

function renderThumbs() {
  els.thumbs.innerHTML = images.map((img, i) =>
    `<div class="thumb ${i === current ? 'current' : ''}" data-i="${i}" title="${escapeHtml(img.title)}" style="background-image:url('${safeUrl(img.src)}')"></div>`
  ).join('');
}

function safeUrl(url) {
  return String(url).replace(/'/g, "%27");
}
function escapeHtml(s) {
  return String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function setBackground(el, img) {
  el.style.backgroundImage = `url("${safeUrl(img.src)}")`;
}

function randomIndex() {
  if (images.length <= 1) return 0;
  let i = Math.floor(Math.random() * images.length);
  let tries = 0;
  while (i === current && tries < 10) {
    i = Math.floor(Math.random() * images.length);
    tries++;
  }
  return i;
}

function nextIndex(direction = 1) {
  if (randomPhotos) return randomIndex();
  return (current + direction + images.length) % images.length;
}

function randomEffect() {
  return EFFECTS[Math.floor(Math.random() * EFFECTS.length)][0];
}

function clearFx(el) {
  [...el.classList].filter(c => c.startsWith('fx-')).forEach(c => el.classList.remove(c));
  void el.offsetWidth;
}

function transitionTo(index, opts = {}) {
  if (!images.length) return;
  previous = current;
  current = ((index % images.length) + images.length) % images.length;
  history.push(current);
  if (history.length > 30) history.shift();

  const incoming = showingA ? els.slideB : els.slideA;
  const outgoing = showingA ? els.slideA : els.slideB;
  const img = images[current];
  const effect = opts.effect || (randomEffects ? randomEffect() : selectedEffect);

  setBackground(incoming, img);
  clearFx(incoming);
  incoming.classList.add(`fx-${effect}`);
  incoming.style.zIndex = '3';
  outgoing.style.zIndex = '2';
  incoming.style.opacity = '1';
  outgoing.style.opacity = '0';
  showingA = !showingA;

  els.captionMain.textContent = img.title || `Photo ${String(current + 1).padStart(2,'0')}`;
  els.captionSub.textContent = img.sub || `Effect: ${effect}`;
  els.counter.textContent = `${String(current + 1).padStart(2,'0')} / ${String(images.length).padStart(2,'0')}`;
  els.ambient.style.background = ambientFromTitle(img.title || 'gallery');
  renderThumbs();
  startProgress();
  scheduleNext();
}

function ambientFromTitle(seed) {
  let hash = 0;
  for (let i=0;i<seed.length;i++) hash = ((hash<<5)-hash)+seed.charCodeAt(i) | 0;
  const h1 = Math.abs(hash)%360;
  const h2 = (h1+90)%360;
  return `radial-gradient(circle at 20% 20%, hsl(${h1} 55% 28%) 0 10%, transparent 36%), radial-gradient(circle at 80% 75%, hsl(${h2} 45% 26%) 0 8%, transparent 34%), #111`;
}

function showCurrent() {
  const img = images[current];
  setBackground(els.slideA, img);
  els.slideA.style.opacity = '1';
  els.slideA.style.zIndex = '2';
  els.slideB.style.opacity = '0';
  showingA = true;
  els.captionMain.textContent = img.title || `Photo ${String(current+1).padStart(2,'0')}`;
  els.captionSub.textContent = img.sub || 'My collection';
  els.counter.textContent = `${String(current + 1).padStart(2,'0')} / ${String(images.length).padStart(2,'0')}`;
  els.ambient.style.background = ambientFromTitle(img.title || 'gallery');
  renderThumbs();
}

function preload() {
  images.forEach(img => { const im = new Image(); im.src = img.src; });
}

function scheduleNext() {
  clearTimeout(timer);
  if (!running || images.length < 2) return;
  timer = setTimeout(() => transitionTo(nextIndex(1)), Number(els.interval.value) * 1000);
}

function startProgress() {
  clearInterval(progressTimer);
  els.progress.style.transition = 'none';
  els.progress.style.width = '0%';
  void els.progress.offsetWidth;
  if (!running) return;
  els.progress.style.transition = `width ${Number(els.interval.value)}s linear`;
  els.progress.style.width = '100%';
}

function togglePlay() {
  running = !running;
  els.playPause.querySelector('.play-icon').textContent = running ? '❚❚' : '▶';
  if (running) { startProgress(); scheduleNext(); }
  else { clearTimeout(timer); clearInterval(progressTimer); }
}

els.playPause.addEventListener('click', togglePlay);
els.nextBtn.addEventListener('click', () => transitionTo(nextIndex(1)));
els.prevBtn.addEventListener('click', () => transitionTo((current - 1 + images.length) % images.length));
els.shuffleBtn.addEventListener('click', () => transitionTo(randomIndex()));
els.interval.addEventListener('input', () => {
  els.intervalValue.textContent = els.interval.value;
  persist();
  startProgress();
  scheduleNext();
});
els.randomToggle.addEventListener('click', () => { randomPhotos = !randomPhotos; applyToggle(els.randomToggle, randomPhotos); persist(); });
els.effectToggle.addEventListener('click', () => { randomEffects = !randomEffects; applyToggle(els.effectToggle, randomEffects); persist(); });
els.effectPills.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-effect]');
  if (!btn) return;
  selectedEffect = btn.dataset.effect;
  randomEffects = false;
  applyToggle(els.effectToggle, false);
  renderEffectPills();
  persist();
});
els.thumbs.addEventListener('click', (e) => {
  const t = e.target.closest('[data-i]');
  if (t) transitionTo(Number(t.dataset.i), { effect: randomEffects ? randomEffect() : selectedEffect });
});
els.openPanel.addEventListener('click', () => els.panel.classList.add('open'));
els.closePanel.addEventListener('click', () => els.panel.classList.remove('open'));
els.fullscreenBtn.addEventListener('click', async () => {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  } catch {}
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') transitionTo(nextIndex(1));
  else if (e.key === 'ArrowLeft') transitionTo((current - 1 + images.length) % images.length);
  else if (e.key === ' ') { e.preventDefault(); togglePlay(); }
  else if (e.key.toLowerCase() === 's') els.panel.classList.toggle('open');
  else if (e.key.toLowerCase() === 'f') els.fullscreenBtn.click();
});

let touchStartX = 0;
window.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, {passive:true});
window.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 50) dx < 0 ? transitionTo(nextIndex(1)) : transitionTo((current - 1 + images.length) % images.length);
}, {passive:true});

els.addFilesBtn.addEventListener('click', () => els.fileInput.click());
els.loadDriveBtn.addEventListener('click', loadGoogleDriveImages);
els.driveFolder.addEventListener('keydown', e => { if (e.key === 'Enter') loadGoogleDriveImages(); });
els.driveApiKey.addEventListener('keydown', e => { if (e.key === 'Enter') loadGoogleDriveImages(); });
els.fileInput.addEventListener('change', e => addFiles([...e.target.files]));
['dragenter','dragover'].forEach(type => els.dropzone.addEventListener(type, e => { e.preventDefault(); els.dropzone.style.borderColor = '#fff'; }));
['dragleave','drop'].forEach(type => els.dropzone.addEventListener(type, e => { e.preventDefault(); els.dropzone.style.borderColor = ''; }));
els.dropzone.addEventListener('drop', e => addFiles([...e.dataTransfer.files].filter(f => f.type.startsWith('image/'))));

function addFiles(files) {
  if (!files.length) return;
  const additions = files.map((file, idx) => ({ src: URL.createObjectURL(file), title: file.name.replace(/\.[^.]+$/, ''), sub: 'Local photo' + (idx ? ` · ${idx+1}` : '') }));
  images = [...images, ...additions];
  preload();
  renderThumbs();
  if (images.length === additions.length) transitionTo(0);
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { clearTimeout(timer); clearInterval(progressTimer); }
  else if (running) { startProgress(); scheduleNext(); }
});

showCurrent();
preload();
scheduleNext();
