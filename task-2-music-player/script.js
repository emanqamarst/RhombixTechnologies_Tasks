// music player - built this over a few days
// using web audio api so no external mp3 needed, everything generates in browser

const songs = [
  {
    id: 1,
    title: 'Midnight Drive',
    artist: 'Luna Echo',
    category: 'chill',
    duration: '3:24',
    cover: 'https://picsum.photos/seed/midnight/300/300',
    color: '#7c5cfc',
    synth: { scale: 'minor', root: 220, tempo: 72, wave: 'sine', bass: true, pad: true, arp: false, swing: 0.1 }
  },
  {
    id: 2,
    title: 'Summer Haze',
    artist: 'Solaris',
    category: 'pop',
    duration: '2:58',
    cover: 'https://picsum.photos/seed/summer/300/300',
    color: '#fc9d5c',
    synth: { scale: 'major', root: 261, tempo: 110, wave: 'triangle', bass: true, pad: false, arp: true, swing: 0 }
  },
  {
    id: 3,
    title: 'Rain Drops',
    artist: 'AquaTone',
    category: 'lofi',
    duration: '4:10',
    cover: 'https://picsum.photos/seed/raindrops/300/300',
    color: '#5cb8fc',
    synth: { scale: 'minor', root: 196, tempo: 80, wave: 'sine', bass: true, pad: true, arp: false, swing: 0.15 }
  },
  {
    id: 4,
    title: 'Urban Flow',
    artist: 'Street Keys',
    category: 'hiphop',
    duration: '3:47',
    cover: 'https://picsum.photos/seed/urban/300/300',
    color: '#fc5c5c',
    synth: { scale: 'minor', root: 146, tempo: 90, wave: 'sawtooth', bass: true, pad: false, arp: false, swing: 0.2 }
  },
  {
    id: 5,
    title: 'Moonlight Sonata',
    artist: 'Classic AI',
    category: 'classical',
    duration: '5:20',
    cover: 'https://picsum.photos/seed/moonlight/300/300',
    color: '#c8a84b',
    synth: { scale: 'minor', root: 246, tempo: 60, wave: 'sine', bass: false, pad: true, arp: true, swing: 0 }
  },
  {
    id: 6,
    title: 'Neon Pulse',
    artist: 'Cybertune',
    category: 'pop',
    duration: '3:05',
    cover: 'https://picsum.photos/seed/neon/300/300',
    color: '#fc5c9c',
    synth: { scale: 'major', root: 293, tempo: 128, wave: 'square', bass: true, pad: false, arp: true, swing: 0 }
  },
  {
    id: 7,
    title: 'Coffee Shop',
    artist: 'Lo Vibe',
    category: 'lofi',
    duration: '3:55',
    cover: 'https://picsum.photos/seed/coffee/300/300',
    color: '#a87c5c',
    synth: { scale: 'major', root: 220, tempo: 76, wave: 'triangle', bass: true, pad: true, arp: false, swing: 0.12 }
  },
  {
    id: 8,
    title: 'City Lights',
    artist: 'Metro Beats',
    category: 'hiphop',
    duration: '2:48',
    cover: 'https://picsum.photos/seed/citylights/300/300',
    color: '#5cfc9c',
    synth: { scale: 'minor', root: 174, tempo: 95, wave: 'sawtooth', bass: true, pad: false, arp: true, swing: 0.18 }
  },
  {
    id: 9,
    title: 'Ocean Drift',
    artist: 'Wave Theory',
    category: 'chill',
    duration: '4:30',
    cover: 'https://picsum.photos/seed/ocean/300/300',
    color: '#5c9cfc',
    synth: { scale: 'major', root: 184, tempo: 65, wave: 'sine', bass: false, pad: true, arp: false, swing: 0 }
  },
  {
    id: 10,
    title: 'Spring Garden',
    artist: 'Quartet X',
    category: 'classical',
    duration: '6:12',
    cover: 'https://picsum.photos/seed/spring/300/300',
    color: '#7cfc5c',
    synth: { scale: 'major', root: 261, tempo: 100, wave: 'triangle', bass: false, pad: true, arp: true, swing: 0 }
  }
];

// scale intervals (semitones from root)
const scales = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10]
};

// convert semitone offset to frequency
function toHz(root, semitones) {
  return root * Math.pow(2, semitones / 12);
}

function getNotes(root, scaleName, octaves) {
  const intervals = scales[scaleName] || scales.major;
  const out = [];
  for (let o = 0; o < octaves; o++) {
    intervals.forEach(i => out.push(toHz(root, i + o * 12)));
  }
  return out;
}


// --- audio engine ---
// using web audio api to generate synth music for each track
// each song sounds different based on its config (wave type, scale, tempo etc)

let audioCtx = null;
let masterGain = null;
let activeNodes = [];
let schedTimer = null;

let engineRunning = false;
let engineStartedAt = 0;   // audioCtx.currentTime when we last hit play
let pausedAt = 0;          // how many seconds had elapsed when we paused
let beatIdx = 0;
let nextBeat = 0;
let currentSong = null;

function bootAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.5;
  masterGain.connect(audioCtx.destination);
}

function playNote(freq, when, dur, wave, vol, detune) {
  detune = detune || 0;
  vol = vol || 0.2;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = wave;
  osc.frequency.value = freq;
  osc.detune.value = detune;

  const atk = Math.min(0.02, dur * 0.1);
  const rel = Math.min(0.15, dur * 0.4);

  gain.gain.setValueAtTime(0, when);
  gain.gain.linearRampToValueAtTime(vol, when + atk);
  gain.gain.setValueAtTime(vol, when + dur - rel);
  gain.gain.linearRampToValueAtTime(0, when + dur);

  // small delay/reverb effect
  const delay = audioCtx.createDelay(0.5);
  delay.delayTime.value = 0.18;
  const delayGain = audioCtx.createGain();
  delayGain.gain.value = 0.15;

  osc.connect(gain);
  gain.connect(masterGain);
  gain.connect(delay);
  delay.connect(delayGain);
  delayGain.connect(masterGain);

  osc.start(when);
  osc.stop(when + dur + 0.1);

  activeNodes.push(osc, gain);

  osc.onended = () => {
    try { osc.disconnect(); gain.disconnect(); delay.disconnect(); delayGain.disconnect(); } catch(e) {}
  };
}

function playKick(when) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.setValueAtTime(150, when);
  osc.frequency.exponentialRampToValueAtTime(40, when + 0.08);
  gain.gain.setValueAtTime(0.9, when);
  gain.gain.exponentialRampToValueAtTime(0.001, when + 0.25);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(when);
  osc.stop(when + 0.3);
  osc.onended = () => { try { osc.disconnect(); gain.disconnect(); } catch(e) {} };
}

function playSnare(when) {
  const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.1, audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  const src = audioCtx.createBufferSource();
  const gain = audioCtx.createGain();
  src.buffer = buf;
  gain.gain.setValueAtTime(0.4, when);
  gain.gain.exponentialRampToValueAtTime(0.001, when + 0.12);
  src.connect(gain);
  gain.connect(masterGain);
  src.start(when);
  src.stop(when + 0.15);
  src.onended = () => { try { src.disconnect(); gain.disconnect(); } catch(e) {} };
}

function playHihat(when, open) {
  const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.05, audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  const src = audioCtx.createBufferSource();
  const filter = audioCtx.createBiquadFilter();
  const gain = audioCtx.createGain();

  src.buffer = buf;
  filter.type = 'highpass';
  filter.frequency.value = 7000;

  const d = open ? 0.15 : 0.04;
  gain.gain.setValueAtTime(0.15, when);
  gain.gain.exponentialRampToValueAtTime(0.001, when + d);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  src.start(when);
  src.stop(when + d + 0.01);
  src.onended = () => { try { src.disconnect(); filter.disconnect(); gain.disconnect(); } catch(e) {} };
}

// melody patterns - just index sequences that loop
const melodyPat = [0, 2, 4, 2, 6, 4, 5, 3, 1, 3, 2, 0, 4, 6, 5, 7];
const arpPat    = [0, 1, 2, 3, 2, 1];
const bassPat   = [0, 0, 4, 0, 4, 0, 3, 4];

function tick() {
  if (!engineRunning || !currentSong) return;

  const s = currentSong.synth;
  const beatDur = 60 / s.tempo;
  const lookAhead = 0.15;
  const notes = getNotes(s.root, s.scale, 2);
  const bassNotes = getNotes(s.root / 2, s.scale, 1);

  while (nextBeat < audioCtx.currentTime + lookAhead) {
    const swingOffset = (beatIdx % 2 === 1) ? s.swing * beatDur : 0;
    const t = nextBeat + swingOffset;

    if (s.bass) {
      if (beatIdx % 4 === 0 || beatIdx % 4 === 2) playKick(t);
      if (beatIdx % 4 === 1 || beatIdx % 4 === 3) playSnare(t);
      playHihat(t, beatIdx % 2 === 1);
    }

    // melody
    const mIdx = melodyPat[beatIdx % melodyPat.length];
    playNote(notes[Math.min(mIdx, notes.length - 1)], t, beatDur * 0.85, s.wave, 0.18);

    // arp - only some songs have it
    if (s.arp && beatIdx % 2 === 0) {
      arpPat.forEach((deg, i) => {
        const f = notes[Math.min(deg, notes.length - 1)] * 2;
        playNote(f, t + i * (beatDur / arpPat.length), (beatDur / arpPat.length) * 0.7, 'triangle', 0.1);
      });
    }

    if (s.bass) {
      const bDeg = bassPat[beatIdx % bassPat.length];
      playNote(bassNotes[Math.min(bDeg, bassNotes.length - 1)], t, beatDur * 1.8, 'triangle', 0.35);
    }

    // pad chord every 4 beats
    if (s.pad && beatIdx % 4 === 0) {
      [0, 2, 4].forEach(deg => {
        const f = notes[Math.min(deg, notes.length - 1)];
        playNote(f, t, beatDur * 4 * 0.95, 'sine', 0.08, (Math.random() - 0.5) * 5);
      });
    }

    beatIdx++;
    nextBeat += beatDur;
  }
}

// public audio controls
const audio = {
  get currentTime() {
    if (!audioCtx || !engineRunning) return pausedAt;
    return pausedAt + (audioCtx.currentTime - engineStartedAt);
  },
  get duration() {
    if (!currentSong) return 0;
    const [m, s] = currentSong.duration.split(':').map(Number);
    return m * 60 + (s || 0);
  },
  load(song) {
    this.stop();
    currentSong = song;
    pausedAt = 0;
    beatIdx = 0;
  },
  play() {
    if (!currentSong) return;
    bootAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    engineRunning = true;
    engineStartedAt = audioCtx.currentTime;
    nextBeat = audioCtx.currentTime;

    // if resuming mid-song, fast-forward the beat index
    if (pausedAt > 0) {
      const beatDur = 60 / currentSong.synth.tempo;
      beatIdx = Math.floor(pausedAt / beatDur);
    }

    schedTimer = setInterval(tick, 50);
    tick();
  },
  pause() {
    if (!engineRunning) return;
    pausedAt += audioCtx.currentTime - engineStartedAt;
    engineRunning = false;
    clearInterval(schedTimer);

    // fade out active nodes
    const now = audioCtx.currentTime;
    activeNodes.forEach(n => {
      try {
        if (n.gain) n.gain.linearRampToValueAtTime(0, now + 0.05);
        if (n.stop) n.stop(now + 0.07);
      } catch(e) {}
    });
    activeNodes = [];
  },
  stop() {
    this.pause();
    pausedAt = 0;
    beatIdx = 0;
    currentSong = null;
  },
  seek(seconds) {
    const wasPlaying = engineRunning;
    if (engineRunning) {
      engineRunning = false;
      clearInterval(schedTimer);
      activeNodes.forEach(n => { try { if (n.stop) n.stop(0); } catch(e) {} });
      activeNodes = [];
    }
    pausedAt = Math.max(0, seconds);
    if (wasPlaying) this.play();
  },
  setVolume(v) {
    bootAudio();
    if (masterGain) masterGain.gain.value = Math.max(0, Math.min(1, v));
  },
  mute(on) {
    bootAudio();
    if (masterGain) masterGain.gain.value = on ? 0 : (state.volume / 100);
  }
};


// --- app state ---
const state = {
  idx: 0,
  playing: false,
  shuffle: false,
  repeat: false,
  muted: false,
  volume: 80,
  search: '',
  category: 'all',
  filtered: [...songs]
};

// grab all the dom elements once
const el = {
  loader:       document.getElementById('loader'),
  toast:        document.getElementById('toast'),
  sidebar:      document.getElementById('sidebar'),
  sidebarClose: document.getElementById('sidebarClose'),
  menuBtn:      document.getElementById('menuBtn'),
  canvas:       document.getElementById('particles'),

  albumArt:     document.getElementById('albumArt'),
  albumWrap:    document.getElementById('albumWrap'),
  albumGlow:    document.getElementById('albumGlow'),
  eqRing:       document.getElementById('eqRing'),
  eqBars:       document.getElementById('eqBars'),

  songTitle:    document.getElementById('songTitle'),
  songArtist:   document.getElementById('songArtist'),
  songCategory: document.getElementById('songCategory'),
  songInfo:     null, // set below

  progressFill:  document.getElementById('progressFill'),
  progressThumb: document.getElementById('progressThumb'),
  progressWrap:  document.getElementById('progressWrap'),
  currentTime:   document.getElementById('currentTime'),
  totalTime:     document.getElementById('totalTime'),

  playBtn:      document.getElementById('playBtn'),
  prevBtn:      document.getElementById('prevBtn'),
  nextBtn:      document.getElementById('nextBtn'),
  shuffleBtn:   document.getElementById('shuffleBtn'),
  repeatBtn:    document.getElementById('repeatBtn'),

  muteBtn:      document.getElementById('muteBtn'),
  volSlider:    document.getElementById('volumeSlider'),
  volFill:      document.getElementById('volFill'),
  volLabel:     document.getElementById('volLabel'),
  volIcon:      document.getElementById('volIcon'),

  themeBtn:     document.getElementById('themeToggle'),
  searchInput:  document.getElementById('searchInput'),
  clearSearch:  document.getElementById('clearSearch'),
  playlist:     document.getElementById('playlist'),
  plCount:      document.getElementById('playlistCount'),

  playIcon:     document.querySelector('.play-icon'),
  pauseIcon:    document.querySelector('.pause-icon'),
};

el.songInfo = el.songTitle.closest('.song-info') || el.songTitle.parentElement;


// particles background - simple canvas animation
function initParticles() {
  const canvas = el.canvas;
  const ctx = canvas.getContext('2d');
  let W, H, pts;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function mkParticles() {
    pts = Array.from({ length: 55 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 2 + 0.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      o: Math.random() * 0.5 + 0.1
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const dark = document.documentElement.getAttribute('data-theme') !== 'light';
    const c = dark ? '200,180,255' : '100,80,180';

    pts.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${c},${p.o})`;
      ctx.fill();

      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
    });

    requestAnimationFrame(draw);
  }

  resize();
  mkParticles();
  draw();
  window.addEventListener('resize', () => { resize(); mkParticles(); });
}


// toast - quick notification at bottom of screen
let toastTimeout;
function toast(msg, ms) {
  ms = ms || 2200;
  el.toast.textContent = msg;
  el.toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => el.toast.classList.remove('show'), ms);
}


// localStorage helpers
function savePrefs() {
  localStorage.setItem('vbx_idx',     state.idx);
  localStorage.setItem('vbx_vol',     state.volume);
  localStorage.setItem('vbx_theme',   document.documentElement.getAttribute('data-theme'));
  localStorage.setItem('vbx_repeat',  state.repeat);
  localStorage.setItem('vbx_shuffle', state.shuffle);
}

function loadPrefs() {
  const idx     = parseInt(localStorage.getItem('vbx_idx'));
  const vol     = parseInt(localStorage.getItem('vbx_vol'));
  const theme   = localStorage.getItem('vbx_theme') || 'dark';
  state.idx     = (!isNaN(idx) && idx < songs.length) ? idx : 0;
  state.volume  = !isNaN(vol) ? vol : 80;
  state.repeat  = localStorage.getItem('vbx_repeat')  === 'true';
  state.shuffle = localStorage.getItem('vbx_shuffle') === 'true';
  document.documentElement.setAttribute('data-theme', theme);
}


function fmtTime(secs) {
  if (!secs || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}


// render the playlist sidebar list
function renderPlaylist() {
  el.playlist.innerHTML = '';

  if (state.filtered.length === 0) {
    el.playlist.innerHTML = '<li style="padding:24px;text-align:center;color:var(--text-muted);font-size:13px;">No results</li>';
    el.plCount.textContent = '0 songs';
    return;
  }

  el.plCount.textContent = `${state.filtered.length} song${state.filtered.length !== 1 ? 's' : ''}`;

  state.filtered.forEach(song => {
    const active = song.id === songs[state.idx].id;
    const li = document.createElement('li');
    li.className = 'playlist-item' + (active ? ' active' : '') + (active && state.playing ? ' playing' : '');
    li.dataset.songId = song.id;

    li.innerHTML = `
      <img class="pl-thumb" src="${song.cover}" alt="${song.title}" loading="lazy" />
      <div class="pl-info">
        <div class="pl-title">${song.title}</div>
        <div class="pl-artist">${song.artist}</div>
      </div>
      <span class="pl-duration">${song.duration}</span>
      <div class="pl-playing-indicator" aria-hidden="true">
        <span></span><span></span><span></span>
      </div>
    `;

    li.addEventListener('click', () => {
      const realIdx = songs.findIndex(s => s.id === song.id);
      if (realIdx !== -1) playSong(realIdx);
    });

    el.playlist.appendChild(li);
  });
}

// just update the highlight without rebuilding the whole list
function highlightActive() {
  const activeId = songs[state.idx].id;
  document.querySelectorAll('.playlist-item').forEach(li => {
    const isIt = parseInt(li.dataset.songId) === activeId;
    li.classList.toggle('active', isIt);
    li.classList.toggle('playing', isIt && state.playing);
  });

  const activeEl = el.playlist.querySelector('.playlist-item.active');
  if (activeEl) activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}


// load song into UI (doesn't start playing)
function loadSong(idx) {
  const song = songs[idx];
  if (!song) return;

  state.idx = idx;

  // little animation when song changes
  el.songInfo.classList.add('changing');
  setTimeout(() => el.songInfo.classList.remove('changing'), 300);

  el.songTitle.textContent    = song.title;
  el.songArtist.textContent   = song.artist;
  el.songCategory.textContent = song.category[0].toUpperCase() + song.category.slice(1);

  el.albumArt.src = song.cover;
  el.albumGlow.style.background = song.color;

  // reset progress bar
  el.progressFill.style.width = '0%';
  el.progressThumb.style.left = '0%';
  el.currentTime.textContent = '0:00';
  el.totalTime.textContent = song.duration;

  audio.load(song);
  highlightActive();
  savePrefs();
}

function playSong(idx) {
  loadSong(idx);
  audio.play();
  setPlaying(true);
  toast('▶  ' + songs[idx].title);
}

// sync all UI to current playing state
function setPlaying(playing) {
  state.playing = playing;

  el.playIcon.style.display  = playing ? 'none'  : 'block';
  el.pauseIcon.style.display = playing ? 'block' : 'none';

  el.albumArt.classList.toggle('spinning', playing);
  el.albumArt.classList.toggle('paused', !playing);

  el.eqRing.classList.toggle('active', playing);
  el.eqBars.classList.toggle('playing', playing);

  highlightActive();
}

function togglePlay() {
  if (state.playing) {
    audio.pause();
    setPlaying(false);
  } else {
    audio.play();
    setPlaying(true);
  }
}

function nextSong() {
  let next;
  if (state.shuffle) {
    // pick random that isn't current
    const pool = songs.map((_, i) => i).filter(i => i !== state.idx);
    next = pool[Math.floor(Math.random() * pool.length)];
  } else {
    next = (state.idx + 1) % songs.length;
  }
  playSong(next);
}

function prevSong() {
  // if we're more than 3s in just restart instead of going back
  if (audio.currentTime > 3) {
    audio.seek(0);
    return;
  }
  const prev = state.shuffle
    ? Math.floor(Math.random() * songs.length)
    : (state.idx - 1 + songs.length) % songs.length;
  playSong(prev);
}

function toggleShuffle() {
  state.shuffle = !state.shuffle;
  el.shuffleBtn.classList.toggle('active', state.shuffle);
  toast(state.shuffle ? '🔀 Shuffle on' : '🔀 Shuffle off');
  savePrefs();
}

function toggleRepeat() {
  state.repeat = !state.repeat;
  el.repeatBtn.classList.toggle('active', state.repeat);
  toast(state.repeat ? '🔁 Repeat on' : '🔁 Repeat off');
  savePrefs();
}

function setVolume(v) {
  state.volume = Math.max(0, Math.min(100, v));
  audio.setVolume(state.volume / 100);
  el.volSlider.value = state.volume;
  el.volFill.style.width = state.volume + '%';
  el.volLabel.textContent = state.volume + '%';
  updateVolIcon();
  savePrefs();
}

// swap the svg path depending on volume level - 3 states
function updateVolIcon() {
  const v = state.muted ? 0 : state.volume;
  let d;
  if (v === 0)
    d = 'M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0 0 17.73 18L19 19.27 20.27 18 5.27 3 4.27 3zM12 4 9.91 6.09 12 8.18V4z';
  else if (v < 40)
    d = 'M18.5 12A4.5 4.5 0 0 0 16 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z';
  else
    d = 'M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z';
  el.volIcon.querySelector('path').setAttribute('d', d);
}

function toggleMute() {
  state.muted = !state.muted;
  audio.mute(state.muted);
  updateVolIcon();
  toast(state.muted ? '🔇 Muted' : '🔊 Unmuted');
}


// progress bar tick - runs every 250ms
let progressInterval = null;

function startProgressLoop() {
  clearInterval(progressInterval);
  progressInterval = setInterval(() => {
    const cur = audio.currentTime;
    const dur = audio.duration;
    if (!dur) return;

    if (cur >= dur) {
      if (state.repeat) {
        audio.seek(0);
      } else {
        nextSong();
      }
      return;
    }

    const pct = (cur / dur) * 100;
    el.progressFill.style.width = pct + '%';
    el.progressThumb.style.left = pct + '%';
    el.currentTime.textContent = fmtTime(cur);
    el.totalTime.textContent = fmtTime(dur);
    el.progressWrap.setAttribute('aria-valuenow', Math.round(pct));
  }, 250);
}

function setupSeek() {
  let dragging = false;

  function doSeek(e) {
    const rect = el.progressWrap.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    audio.seek(pct * audio.duration);
  }

  el.progressWrap.addEventListener('mousedown', e => { dragging = true; doSeek(e); });
  el.progressWrap.addEventListener('touchstart', e => { dragging = true; doSeek(e); }, { passive: true });
  window.addEventListener('mousemove', e => { if (dragging) doSeek(e); });
  window.addEventListener('touchmove', e => { if (dragging) doSeek(e); }, { passive: true });
  window.addEventListener('mouseup', () => { dragging = false; });
  window.addEventListener('touchend', () => { dragging = false; });

  el.progressWrap.addEventListener('keydown', e => {
    const dur = audio.duration;
    if (!dur) return;
    if (e.key === 'ArrowRight') audio.seek(Math.min(dur, audio.currentTime + 5));
    if (e.key === 'ArrowLeft')  audio.seek(Math.max(0,   audio.currentTime - 5));
  });
}

function setupSearch() {
  el.searchInput.addEventListener('input', e => {
    state.search = e.target.value;
    el.clearSearch.classList.toggle('visible', !!state.search);
    filterSongs();
  });

  el.clearSearch.addEventListener('click', () => {
    el.searchInput.value = '';
    state.search = '';
    el.clearSearch.classList.remove('visible');
    filterSongs();
    el.searchInput.focus();
  });
}

function setupCategories() {
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.category = btn.dataset.cat;
      filterSongs();
    });
  });
}

function filterSongs() {
  const q = state.search.toLowerCase().trim();
  const cat = state.category;
  state.filtered = songs.filter(s => {
    const okCat = cat === 'all' || s.category === cat;
    const okQ = !q || s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q);
    return okCat && okQ;
  });
  renderPlaylist();
}

function setupSidebar() {
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  document.body.appendChild(overlay);

  const open = () => {
    el.sidebar.classList.add('open');
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    el.sidebar.classList.remove('open');
    overlay.classList.remove('show');
    document.body.style.overflow = '';
  };

  el.menuBtn.addEventListener('click', open);
  el.sidebarClose.addEventListener('click', close);
  overlay.addEventListener('click', close);
}

function setupKeyboard() {
  document.addEventListener('keydown', e => {
    // don't intercept typing in inputs
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        togglePlay();
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (document.activeElement === el.progressWrap) return;
        nextSong();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (document.activeElement === el.progressWrap) return;
        prevSong();
        break;
      case 'ArrowUp':
        e.preventDefault();
        setVolume(state.volume + 5);
        toast('🔊 ' + state.volume + '%');
        break;
      case 'ArrowDown':
        e.preventDefault();
        setVolume(state.volume - 5);
        toast('🔊 ' + state.volume + '%');
        break;
      case 'KeyM': toggleMute();   break;
      case 'KeyS': toggleShuffle(); break;
      case 'KeyR': toggleRepeat();  break;
    }
  });
}

function setupTheme() {
  el.themeBtn.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    toast(next === 'dark' ? '🌙 Dark mode' : '☀ Light mode');
    savePrefs();
  });
}

// album art click also toggles play
function setupAlbumClick() {
  el.albumWrap.addEventListener('click', () => {
    el.albumArt.style.transform = 'scale(0.94)';
    setTimeout(() => el.albumArt.style.transform = '', 180);
    togglePlay();
  });
}


// wire up all the buttons
function setupControls() {
  el.playBtn.addEventListener('click', togglePlay);
  el.nextBtn.addEventListener('click', nextSong);
  el.prevBtn.addEventListener('click', prevSong);
  el.shuffleBtn.addEventListener('click', toggleShuffle);
  el.repeatBtn.addEventListener('click', toggleRepeat);
  el.muteBtn.addEventListener('click', toggleMute);

  el.volSlider.addEventListener('input', e => {
    state.muted = false;
    setVolume(parseInt(e.target.value));
  });
}


// kick everything off
function init() {
  loadPrefs();
  initParticles();
  renderPlaylist();

  el.shuffleBtn.classList.toggle('active', state.shuffle);
  el.repeatBtn.classList.toggle('active', state.repeat);

  setVolume(state.volume);
  loadSong(state.idx);

  setupSeek();
  setupControls();
  setupSearch();
  setupCategories();
  setupTheme();
  setupSidebar();
  setupKeyboard();
  setupAlbumClick();
  startProgressLoop();

  setTimeout(() => el.loader.classList.add('hidden'), 1400);
  setTimeout(() => toast('🎵 Welcome to Vibex'), 1700);
}

document.addEventListener('DOMContentLoaded', init);