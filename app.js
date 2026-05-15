pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Quita parámetros de tracking de la URL
if (location.search) {
  history.replaceState({}, "", location.pathname);
}

const REPO_OWNER = "CarlosMazzu06";
const REPO_NAME = "lector-app";
const BOOK_FOLDER = "book";
const GITHUB_API = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${BOOK_FOLDER}`;

// Respaldo manual con los nombres EXACTOS de los libros en /book
const BOOKS_FALLBACK = [
  {
    title: "Zensorialmente",
    file: "book/Zensorialmente_Estanislao_Bachrach.epub",
    type: "epub"
  },
  {
    title: "Anatomía de un esquema Ponzi",
    file: "book/Anatomía de un esquema Ponzi Estafas pasadas y presentes (Colleen Cross) (Z-Library).epub",
    type: "epub"
  }
];

// Música generada localmente – cinco piezas con nombre y subtítulo
const MUSIC_TRACKS = [
  {
    id: "roble",
    title: "Nocturno de Roble",
    subtitle: "Arpegios graves y cálidos",
    loopMs: 16000,
    perform(ctx, dest, start) {
      playTone(ctx, dest, start, 73.42, 3.6, { waveform: "sine", gain: 0.15, cutoff: 520, pan: -0.1 });
      const seq = [146.83, 174.61, 196.00, 174.61];
      seq.forEach((freq, i) => playTone(ctx, dest, start + i * 0.85, freq, 0.85, { waveform: "triangle", gain: 0.20, cutoff: 1300, pan: i % 2 ? 0.12 : -0.12 }));
      playChord(ctx, dest, start + 4.0, [220.00, 261.63, 329.63], 4.2, { waveform: "sine", gain: 0.13, cutoff: 1600, detuneStep: 2, pan: 0 });
      playTone(ctx, dest, start + 9.0, 98.00, 2.8, { waveform: "sine", gain: 0.11, cutoff: 600, pan: -0.08 });
    }
  },
  {
    id: "lluvia",
    title: "Pergamino en Lluvia",
    subtitle: "Pads suaves y pulsos de agua",
    loopMs: 18000,
    perform(ctx, dest, start) {
      const chordA = [196.00, 246.94, 293.66];
      const chordB = [174.61, 220.00, 277.18];
      playChord(ctx, dest, start, chordA, 4.8, { waveform: "sine", gain: 0.13, cutoff: 1500, detuneStep: 3, pan: 0 });
      playTone(ctx, dest, start + 4.5, 392.00, 1.8, { waveform: "triangle", gain: 0.10, cutoff: 1800, pan: 0.2 });
      playChord(ctx, dest, start + 6.4, chordB, 4.8, { waveform: "sine", gain: 0.13, cutoff: 1500, detuneStep: 3, pan: 0 });
      playTone(ctx, dest, start + 12.0, 523.25, 1.2, { waveform: "sine", gain: 0.09, cutoff: 2000, pan: -0.2 });
    }
  },
  {
    id: "salon",
    title: "Salón Dorado",
    subtitle: "Pulso elegante y cámara",
    loopMs: 15000,
    perform(ctx, dest, start) {
      const bass = [110.00, 130.81, 146.83];
      bass.forEach((freq, i) => playTone(ctx, dest, start + i * 1.3, freq, 1.1, { waveform: "sawtooth", gain: 0.10, cutoff: 900, pan: -0.15 }));
      const melody = [220.00, 246.94, 261.63, 329.63, 261.63];
      melody.forEach((freq, i) => playTone(ctx, dest, start + 0.6 + i * 0.95, freq, 0.7, { waveform: "triangle", gain: 0.16, cutoff: 1700, pan: i % 2 ? 0.12 : -0.12 }));
      playChord(ctx, dest, start + 7.0, [293.66, 369.99, 440.00], 3.5, { waveform: "triangle", gain: 0.13, cutoff: 1700, detuneStep: 4, pan: 0 });
    }
  },
  {
    id: "tinta",
    title: "Tinta y Cobre",
    subtitle: "Campanas suaves y sombra baja",
    loopMs: 17000,
    perform(ctx, dest, start) {
      playTone(ctx, dest, start, 98.00, 4.0, { waveform: "sine", gain: 0.12, cutoff: 500, pan: -0.08 });
      playTone(ctx, dest, start + 1.2, 196.00, 0.5, { waveform: "square", gain: 0.08, cutoff: 2400, pan: 0.15 });
      playTone(ctx, dest, start + 3.2, 261.63, 0.7, { waveform: "triangle", gain: 0.12, cutoff: 1800, pan: -0.1 });
      playTone(ctx, dest, start + 6.6, 329.63, 0.9, { waveform: "triangle", gain: 0.11, cutoff: 1800, pan: 0.1 });
      playTone(ctx, dest, start + 10.0, 392.00, 0.6, { waveform: "sine", gain: 0.10, cutoff: 2200, pan: 0.2 });
    }
  },
  {
    id: "catedral",
    title: "Cúpula de Noche",
    subtitle: "Drone profundo y brillo lejano",
    loopMs: 20000,
    perform(ctx, dest, start) {
      playTone(ctx, dest, start, 65.41, 7.0, { waveform: "sine", gain: 0.12, cutoff: 420, pan: 0 });
      playTone(ctx, dest, start + 1.8, 130.81, 5.0, { waveform: "triangle", gain: 0.10, cutoff: 900, pan: -0.1 });
      playTone(ctx, dest, start + 4.0, 261.63, 2.0, { waveform: "sine", gain: 0.08, cutoff: 1600, pan: 0.12 });
      playTone(ctx, dest, start + 8.0, 523.25, 1.2, { waveform: "sine", gain: 0.08, cutoff: 2500, pan: -0.12 });
      playTone(ctx, dest, start + 12.0, 392.00, 1.0, { waveform: "triangle", gain: 0.09, cutoff: 1800, pan: 0.08 });
    }
  }
];

const STOPWORDS = new Set([
  "a","acá","ahí","al","algo","algunas","algunos","ante","antes","aquí","así","aun","aunque","bajo","bien",
  "como","con","contra","cual","cuales","cuando","de","del","desde","donde","dos","el","ella","ellas","ellos",
  "en","entre","era","eran","es","esa","esas","ese","eso","esos","esta","estaba","estaban","este","esto","estos",
  "fue","ha","han","hay","la","las","le","les","lo","los","más","me","mi","mis","mucho","muy","no","nos","o",
  "para","pero","por","porque","que","qué","se","si","sin","sobre","su","sus","también","te","tiene","tienen",
  "todo","un","una","uno","unos","unas","y","ya","yo","ser","dentro","fuera","mientras","según","tras","tanto","cada","casi","toda"
]);

let books = [];
let currentPDF = null;
let currentEpub = null;
let rendition = null;
let isEpub = false;
let currentPage = 1;
let currentText = "";
let currentBookTitle = "";
let pdfZoom = 1.0;
let epubFontPercent = 100;

let musicContext = null;
let musicMasterGain = null;
let musicCompressor = null;
let musicPlaying = false;
let musicLoopHandle = null;
let musicCurrentTrackId = localStorage.getItem("santuario_music_track") || MUSIC_TRACKS[0].id;
let musicVolume = clamp(Number(localStorage.getItem("santuario_music_volume") || "1.15"), 0.6, 1.5);
let selectedVoiceURI = localStorage.getItem("santuario_voice_uri") || "";
let voiceRate = clamp(Number(localStorage.getItem("santuario_voice_rate") || "0.96"), 0.8, 1.1);
let availableVoices = [];

const $ = (id) => document.getElementById(id);
const els = {
  home: $("homeScreen"),
  readerScreen: $("readerScreen"),
  readerDiv: $("reader"),
  readerContainer: $("readerContainer"),
  title: $("currentTitle"),
  loader: $("loader"),
  loaderText: $("loaderText"),
  loaderSubtext: $("loaderSubtext"),
  bookGrid: $("bookGrid"),
  fileInput: $("fileInput"),
  settingsModal: $("settingsModal"),
  iaModal: $("iaModal"),
  iaContent: $("iaContent"),
  btnMusica: $("btn-musica"),
  musicBoard: $("musicBoard"),
  musicNow: $("musicNow"),
  musicVolume: $("musicVolume"),
  voiceSelect: $("voiceSelect"),
  voiceRateSelect: $("voiceRateSelect")
};

function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }
function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function escapeHtml(str) { return String(str).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
function escapeAttr(str) { return String(str).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }

function showLoader(text, subtext = "") {
  els.loaderText.textContent = text;
  els.loaderSubtext.textContent = subtext;
  els.loader.classList.remove("hidden");
}
function hideLoader() { els.loader.classList.add("hidden"); }

function openReader(title) {
  els.home.classList.replace("activa", "oculta");
  els.readerScreen.classList.replace("oculta", "activa");
  els.title.textContent = title || "Lectura";
  closeModals();
}

function goHome() {
  stopVoice(); stopMusic(); cleanup();
  els.readerScreen.classList.replace("activa", "oculta");
  els.home.classList.replace("oculta", "activa");
  closeModals();
}

function toggleSettings() { els.settingsModal.classList.toggle("hidden"); }
function closeIaModal() { els.iaModal.classList.add("hidden"); }
function closeModals() { els.settingsModal.classList.add("hidden"); els.iaModal.classList.add("hidden"); }

function cleanup() {
  if (currentEpub && typeof currentEpub.destroy === "function") { try { currentEpub.destroy(); } catch (_) {} }
  currentPDF = null; currentEpub = null; rendition = null; isEpub = false; currentPage = 1; currentText = ""; currentBookTitle = "";
  els.readerDiv.innerHTML = ""; els.readerDiv.style.fontSize = "28px"; pdfZoom = 1.0; epubFontPercent = 100;
}

function resolveUrl(path) { return encodeURI(path); }

function renderMusicBoard() {
  els.musicBoard.innerHTML = MUSIC_TRACKS.map(track => `
    <button class="music-card ${track.id === musicCurrentTrackId ? "active" : ""}" onclick="selectMusic('${track.id}')">
      <span class="music-card-title">${escapeHtml(track.title)}</span>
      <span class="music-card-subtitle">${escapeHtml(track.subtitle)}</span>
    </button>
  `).join("");
  const selected = MUSIC_TRACKS.find(t => t.id === musicCurrentTrackId) || MUSIC_TRACKS[0];
  els.musicNow.textContent = selected
    ? `Pieza elegida: ${selected.title} — ${selected.subtitle}`
    : "Seleccioná una pieza para iniciar la música.";
}

function populateVoices() {
  const voices = speechSynthesis.getVoices() || [];
  if (!voices.length) { els.voiceSelect.innerHTML = `<option value="">Voz del sistema</option>`; return; }
  availableVoices = voices.slice().sort((a, b) => { const aEs = /^es/i.test(a.lang) ? 0 : 1; const bEs = /^es/i.test(b.lang) ? 0 : 1; return aEs - bEs || a.lang.localeCompare(b.lang) || a.name.localeCompare(b.name); });
  els.voiceSelect.innerHTML = availableVoices.map(v => `<option value="${escapeAttr(v.voiceURI)}">${escapeHtml(v.name)} · ${escapeHtml(v.lang)}</option>`).join("");
  const preferred = availableVoices.find(v => v.voiceURI === selectedVoiceURI) || availableVoices.find(v => /^es/i.test(v.lang)) || availableVoices[0];
  if (preferred) { els.voiceSelect.value = preferred.voiceURI; selectedVoiceURI = preferred.voiceURI; localStorage.setItem("santuario_voice_uri", selectedVoiceURI); }
}

async function loadBooksFromGitHub() {
  const res = await fetch(GITHUB_API, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const files = await res.json();
  books = files.filter(f => f.type === "file" && /\.(epub|pdf)$/i.test(f.name)).map(f => ({ title: f.name.replace(/\.(epub|pdf)$/i, "").replace(/[_-]+/g, " ").trim(), file: f.path, type: f.name.toLowerCase().endsWith(".epub") ? "epub" : "pdf" })).sort((a, b) => a.title.localeCompare(b.title, "es"));
}

function renderBooks() {
  if (!books.length) { els.bookGrid.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:var(--pergamino-oscuro);">No se encontraron libros en /book.</p>`; return; }
  els.bookGrid.innerHTML = books.map((b, i) => `<button class="btn-book" onclick="loadRepoBook(${i})" title="${escapeAttr(b.title)}"><span class="book-icon">${b.type === "epub" ? "✑" : "▣"}</span><div><div class="book-title">${escapeHtml(b.title)}</div><div class="book-meta">${b.type.toUpperCase()}</div></div></button>`).join("");
}

async function init() {
  renderMusicBoard(); populateVoices();
  els.fileInput.addEventListener("change", handleLocalFile);
  els.musicVolume.addEventListener("input", () => setMusicVolume(Number(els.musicVolume.value)));
  els.voiceSelect.addEventListener("change", () => { selectedVoiceURI = els.voiceSelect.value; localStorage.setItem("santuario_voice_uri", selectedVoiceURI); });
  els.voiceRateSelect.addEventListener("change", () => { voiceRate = Number(els.voiceRateSelect.value); localStorage.setItem("santuario_voice_rate", String(voiceRate)); });
  window.addEventListener("resize", () => { if (isEpub && rendition) { try { rendition.resize(window.innerWidth, window.innerHeight); } catch (_) {} } if (!isEpub && currentPDF) { renderPDFPage().catch(() => {}); } });
  speechSynthesis.onvoiceschanged = populateVoices; setTimeout(populateVoices, 400);
  try { await loadBooksFromGitHub(); } catch (err) { console.warn("Usando catálogo de respaldo porque la API no respondió.", err); books = BOOKS_FALLBACK; }
  renderBooks();
  setInitialSelectors();
}

function setInitialSelectors() {
  els.musicVolume.value = String(musicVolume); els.voiceRateSelect.value = String(voiceRate);
  if (selectedVoiceURI) { els.voiceSelect.value = selectedVoiceURI; }
  renderMusicBoard();
}

async function loadRepoBook(index) {
  const book = books[index]; if (!book) return;
  showLoader(`Abriendo ${book.type.toUpperCase()}…`, book.type === "epub" ? "La carga puede tardar unos segundos." : "");
  try {
    const response = await fetch(resolveUrl(book.file), { cache: "no-store" }); if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = await response.arrayBuffer();
    if (book.type === "epub") { const blob = new Blob([buffer], { type: "application/epub+zip" }); const url = URL.createObjectURL(blob); await loadEpubFromUrl(url, book.title); }
    else { await loadPDF(buffer, book.title); }
  } catch (err) { console.error(err); alert(`No se pudo abrir "${book.title}". Verifica que el archivo exista en /book/ y que el nombre sea exacto.`); }
  finally { hideLoader(); }
}

async function handleLocalFile(e) {
  const file = e.target.files?.[0]; if (!file) return;
  showLoader("Procesando archivo local…", file.name.toLowerCase().endsWith(".epub") ? "Preparando EPUB…" : "Preparando PDF…");
  try {
    const buffer = await file.arrayBuffer(); const name = file.name.toLowerCase();
    if (name.endsWith(".epub")) { const blob = new Blob([buffer], { type: "application/epub+zip" }); const url = URL.createObjectURL(blob); await loadEpubFromUrl(url, file.name); }
    else if (name.endsWith(".pdf") || file.type === "application/pdf") { await loadPDF(buffer, file.name); }
    else { alert("Formato no compatible. Solo PDF o EPUB."); }
  } catch (err) { console.error(err); alert("El archivo parece dañado o protegido."); }
  finally { hideLoader(); els.fileInput.value = ""; }
}

async function loadEpubFromUrl(url, title) {
  cleanup(); isEpub = true; currentBookTitle = title; openReader(title);
  await wait(220);
  currentEpub = ePub(url); await currentEpub.ready;
  rendition = currentEpub.renderTo("reader", { width: "100%", height: Math.max(window.innerHeight - 130, 400), flow: "scrolled-doc", spread: "none" });
  if (rendition?.themes) { try { rendition.themes.default({ body: { background: "#F4ECD8", color: "#2C1810", "font-family": "Cormorant Garamond, serif", "line-height": "1.8" } }); rendition.themes.fontSize(`${epubFontPercent}%`); } catch (_) {} }
  rendition.on("rendered", refreshVisibleText); rendition.on("relocated", refreshVisibleText);
  await rendition.display(); refreshVisibleText(); els.title.textContent = title;
}

async function loadPDF(buffer, title) {
  cleanup(); isEpub = false; currentBookTitle = title; currentPDF = await pdfjsLib.getDocument({ data: buffer }).promise; currentPage = 1; openReader(title); await renderPDFPage();
}

async function renderPDFPage() {
  if (!currentPDF) return;
  const page = await currentPDF.getPage(currentPage); const content = await page.getTextContent(); currentText = content.items.map(item => item.str).join(" ").replace(/\s+/g, " ").trim();
  const baseScale = Math.max(1.05, Math.min(1.65, window.innerWidth / 760)); const viewport = page.getViewport({ scale: baseScale * pdfZoom });
  const canvas = document.createElement("canvas"); canvas.width = viewport.width; canvas.height = viewport.height;
  canvas.style.display = "block"; canvas.style.margin = "0 auto"; canvas.style.maxWidth = "100%"; canvas.style.height = "auto"; canvas.style.borderRadius = "14px"; canvas.style.boxShadow = "0 12px 30px rgba(0,0,0,0.10)";
  await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
  els.readerDiv.innerHTML = ""; els.readerDiv.appendChild(canvas); els.readerContainer.scrollTop = 0;
  els.title.textContent = `${currentBookTitle} · Pág. ${currentPage}`;
}

function refreshVisibleText() {
  setTimeout(() => { if (!isEpub) return; try { const iframe = document.querySelector("#reader iframe"); const doc = iframe?.contentDocument || iframe?.contentWindow?.document; const text = doc?.body?.innerText?.replace(/\s+/g, " ").trim(); if (text) currentText = text; } catch (_) {} }, 350);
}

function extractVisibleText() {
  const selection = window.getSelection?.().toString().trim() || ""; if (selection.length > 12) return selection;
  if (isEpub) { try { const iframe = document.querySelector("#reader iframe"); const doc = iframe?.contentDocument || iframe?.contentWindow?.document; const text = doc?.body?.innerText?.replace(/\s+/g, " ").trim(); if (text) { currentText = text; return text; } } catch (_) {} }
  return (currentText || "").trim();
}

function applyEpubFont() { if (rendition?.themes) { try { rendition.themes.fontSize(`${epubFontPercent}%`); } catch (_) {} } }

async function zoomIn() {
  if (isEpub) { epubFontPercent = Math.min(epubFontPercent + 8, 180); applyEpubFont(); }
  else { pdfZoom = Math.min(pdfZoom + 0.12, 1.8); await renderPDFPage(); }
}
async function zoomOut() {
  if (isEpub) { epubFontPercent = Math.max(epubFontPercent - 8, 80); applyEpubFont(); }
  else { pdfZoom = Math.max(pdfZoom - 0.12, 0.78); await renderPDFPage(); }
}

async function nextPage() { stopVoice(); if (isEpub && rendition) { await rendition.next(); refreshVisibleText(); } else if (currentPDF && currentPage < currentPDF.numPages) { currentPage++; await renderPDFPage(); } }
async function prevPage() { stopVoice(); if (isEpub && rendition) { await rendition.prev(); refreshVisibleText(); } else if (currentPDF && currentPage > 1) { currentPage--; await renderPDFPage(); } }

// --- Música generada ---
function getTrackById(id) { return MUSIC_TRACKS.find(track => track.id === id) || MUSIC_TRACKS[0]; }
async function ensureMusicContext() {
  if (!musicContext) { musicContext = new (window.AudioContext || window.webkitAudioContext)(); musicCompressor = musicContext.createDynamicsCompressor(); musicMasterGain = musicContext.createGain(); musicCompressor.threshold.value = -28; musicCompressor.knee.value = 24; musicCompressor.ratio.value = 8; musicCompressor.attack.value = 0.004; musicCompressor.release.value = 0.25; musicMasterGain.gain.value = musicVolume; musicMasterGain.connect(musicCompressor); musicCompressor.connect(musicContext.destination); }
  if (musicContext.state === "suspended") { await musicContext.resume(); }
  if (musicMasterGain) { musicMasterGain.gain.setTargetAtTime(musicVolume, musicContext.currentTime, 0.03); }
}
function setMusicVolume(value) { musicVolume = clamp(Number(value), 0.6, 1.5); localStorage.setItem("santuario_music_volume", String(musicVolume)); if (musicMasterGain && musicContext) { musicMasterGain.gain.setTargetAtTime(musicVolume, musicContext.currentTime, 0.03); } }
function playTone(ctx, destination, startTime, freq, duration, opts = {}) {
  const osc = ctx.createOscillator(); osc.type = opts.waveform || "sine"; osc.frequency.setValueAtTime(freq, startTime);
  const filter = ctx.createBiquadFilter(); filter.type = opts.filter || "lowpass"; filter.frequency.setValueAtTime(opts.cutoff || 1800, startTime); filter.Q.value = opts.q || 0.8;
  const gain = ctx.createGain(); const peak = opts.gain ?? 0.12; const attack = opts.attack ?? 0.03; const release = opts.release ?? 0.28;
  gain.gain.setValueAtTime(0.0001, startTime); gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), startTime + attack); gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration + release);
  osc.connect(filter); filter.connect(gain);
  if (ctx.createStereoPanner) { const panner = ctx.createStereoPanner(); panner.pan.value = opts.pan || 0; gain.connect(panner); panner.connect(destination); } else { gain.connect(destination); }
  osc.start(startTime); osc.stop(startTime + duration + release + 0.05);
}
function playChord(ctx, destination, startTime, freqs, duration, opts = {}) { freqs.forEach((freq, index) => { const detune = opts.detuneStep ? (index - (freqs.length - 1) / 2) * opts.detuneStep : 0; playTone(ctx, destination, startTime + index * 0.015, freq, duration, { ...opts, detune }); }); }
function stopMusic(updateButton = true) { musicPlaying = false; clearTimeout(musicLoopHandle); musicLoopHandle = null; if (musicContext && musicMasterGain) { try { musicMasterGain.gain.setTargetAtTime(0.0001, musicContext.currentTime, 0.02); } catch (_) {} } if (updateButton) { els.btnMusica.classList.remove("activo"); els.btnMusica.setAttribute("aria-pressed", "false"); } }
function scheduleMusic(track) { clearTimeout(musicLoopHandle); const loop = () => { if (!musicPlaying || !musicContext || !musicMasterGain) return; const start = musicContext.currentTime + 0.05; track.perform(musicContext, musicMasterGain, start); musicLoopHandle = setTimeout(loop, track.loopMs); }; loop(); }
async function startMusic(trackId) { await ensureMusicContext(); const track = getTrackById(trackId); if (!track) return; stopMusic(false); musicCurrentTrackId = track.id; localStorage.setItem("santuario_music_track", musicCurrentTrackId); renderMusicBoard(); musicPlaying = true; els.btnMusica.classList.add("activo"); els.btnMusica.setAttribute("aria-pressed", "true"); scheduleMusic(track); }
async function toggleMusic() { const selectedId = musicCurrentTrackId || MUSIC_TRACKS[0].id; if (musicPlaying && selectedId === musicCurrentTrackId) { stopMusic(); return; } await startMusic(selectedId); }
async function selectMusic(id) { musicCurrentTrackId = id; localStorage.setItem("santuario_music_track", musicCurrentTrackId); renderMusicBoard(); await startMusic(id); }

// --- Voz ---
function getVoice() { const voices = speechSynthesis.getVoices() || []; const selected = voices.find(v => v.voiceURI === els.voiceSelect.value); if (selected) return selected; return voices.find(v => /^es/i.test(v.lang)) || voices[0] || null; }
async function playVoice() { let text = extractVisibleText(); if (!text || text.length < 40) { await wait(180); text = extractVisibleText(); } if (!text || text.length < 40) { alert("No hay suficiente texto visible para leer en voz alta."); return; } stopVoice(); const utterance = new SpeechSynthesisUtterance(text.slice(0, 4000)); const voice = getVoice(); if (voice) { utterance.voice = voice; utterance.lang = voice.lang || "es-AR"; } else { utterance.lang = "es-AR"; } utterance.rate = Number(els.voiceRateSelect.value || voiceRate || 0.96); utterance.pitch = 1.0; speechSynthesis.speak(utterance); }
function stopVoice() { speechSynthesis.cancel(); }

// --- Reflexión ---
async function summarizeText() { let text = extractVisibleText(); if (!text || text.length < 120) { await wait(180); text = extractVisibleText(); } if (!text || text.length < 120) { alert("Se necesita más texto visible para generar una reflexión."); return; } const sentences = segmentSentences(text); const keywords = topKeywords(text, 6); const first = shortenSentence(sentences[0] || ""); const middle = shortenSentence(sentences[Math.floor(sentences.length / 2)] || ""); const last = shortenSentence(sentences[sentences.length - 1] || ""); const themeLine = keywords.length ? `Las ideas que más se repiten son: ${keywords.join(", ")}.` : "La página deja una sensación de tensión, memoria y continuidad."; const openQuestion = keywords.length ? `¿Qué cambia si estas palabras se leen como una historia sobre ${keywords.slice(0, 2).join(" y ")} y no solo como información?` : "¿Qué cambia si este fragmento se lee como conflicto, como memoria o como advertencia, en lugar de verlo solo como información?"; const interpretation = buildInterpretation(first, middle, last, keywords); els.iaContent.innerHTML = `<h4>Núcleo</h4><p>${escapeHtml(themeLine)}</p><h4>Premisa</h4><p>${escapeHtml(first || "La apertura instala un tono de observación y expectativa.")}</p><h4>Clímax argumental</h4><p>${escapeHtml(middle || "El centro del pasaje empuja el sentido hacia una capa más profunda.")}</p><h4>Interpretación</h4><p>${escapeHtml(interpretation)}</p><h4>Pregunta para el lector</h4><p>${escapeHtml(openQuestion)}</p><h4>Eco final</h4><p>${escapeHtml(last || "El cierre deja una resonancia abierta y pide una segunda lectura.")}</p>`; els.iaModal.classList.remove("hidden"); }
function segmentSentences(text) { const clean = String(text).replace(/\s+/g, " ").trim(); if (!clean) return []; if (window.Intl && Intl.Segmenter) { return Array.from(new Intl.Segmenter("es", { granularity: "sentence" }).segment(clean)).map(s => s.segment.trim()).filter(Boolean); } return clean.match(/[^.!?]+[.!?]+/g) || [clean]; }
function topKeywords(text, limit = 5) { const words = String(text).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).map(w => w.trim()).filter(w => w.length > 3 && !STOPWORDS.has(w)); const freq = new Map(); for (const w of words) { freq.set(w, (freq.get(w) || 0) + 1); } return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([word]) => word); }
function shortenSentence(sentence, max = 180) { const clean = String(sentence).replace(/\s+/g, " ").trim(); if (!clean) return ""; if (clean.length <= max) return clean; return clean.slice(0, max - 1).trimEnd() + "…"; }
function buildInterpretation(first, middle, last, keywords) { const focus = keywords.length ? keywords.slice(0, 3).join(", ") : "la memoria, la duda y la forma"; const parts = []; parts.push(`La lectura se organiza alrededor de ${focus}.`); if (first) parts.push(`La apertura sugiere un punto de partida claro y estable.`); if (middle) parts.push(`En el centro aparece una tensión que conviene leer con pausa, porque desplaza el sentido literal hacia una capa más humana.`); if (last) parts.push(`El cierre no clausura por completo: deja una vibración que invita a seguir interpretando.`); parts.push(`Como acompañante de lectura, la página pide observar no solo lo que dice, sino también lo que omite, repite o insinúa.`); return parts.join(" "); }

speechSynthesis.onvoiceschanged = populateVoices; setTimeout(populateVoices, 400);
init().then(setInitialSelectors);
