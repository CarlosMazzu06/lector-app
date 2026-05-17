/* ============================================================
   SANTUARIO LITERARIO — APP.JS
   Resolución unificada definitiva (consolidada de 3 dictámenes)
   ------------------------------------------------------------
   Patrón ReAct aplicado a las contradicciones detectadas entre
   <consejo>, <experto> y <senior>.

   Decisiones arquitectónicas finales:
   - Biblioteca 100% dinámica desde GitHub API (/book)
   - SIN BOOKS_FALLBACK con nombres hardcodeados
   - EPUB como Blob URL + espera de layout (requestAnimationFrame + 400ms)
   - Música por Web Audio API (5 piezas locales, audibles en cualquier device)
   - Análisis racional: ideas principales + secundarias + interpretación
   - Ubicador de lectura: progreso + marcador + reloj + "Continuar"
   ============================================================ */

pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

if (location.search) {
  history.replaceState({}, "", location.pathname);
}

/* ------------------------------------------------------------
   CONFIGURACIÓN DE BIBLIOTECA DINÁMICA
   ------------------------------------------------------------ */
const REPO_OWNER = "CarlosMazzu06";
const REPO_NAME = "lector-app";
const BOOK_FOLDER = "book";
const GITHUB_API = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${BOOK_FOLDER}`;

// NOTA ARQUITECTÓNICA: Aquí NO hay nombres de libros fijos.
// La biblioteca se construye desde la API. Si la API falla,
// el usuario sigue pudiendo cargar libros locales.

/* ------------------------------------------------------------
   MÚSICA AMBIENTAL (Web Audio API — 5 piezas locales)
   ------------------------------------------------------------ */
const MUSIC_TRACKS = [
  {
    id: "roble",
    title: "Nocturno de Roble",
    subtitle: "Arpegios graves y cálidos",
    loopMs: 16000,
    perform(ctx, dest, start) {
      playTone(ctx, dest, start, 73.42, 3.6, { waveform: "sine", gain: 0.18, cutoff: 520, pan: -0.1 });
      [146.83, 174.61, 196.00, 174.61].forEach((freq, i) => {
        playTone(ctx, dest, start + i * 0.85, freq, 0.85, { waveform: "triangle", gain: 0.22, cutoff: 1300, pan: i % 2 ? 0.12 : -0.12 });
      });
      playChord(ctx, dest, start + 4.0, [220.00, 261.63, 329.63], 4.2, { waveform: "sine", gain: 0.15, cutoff: 1600, detuneStep: 2, pan: 0 });
      playTone(ctx, dest, start + 9.0, 98.00, 2.8, { waveform: "sine", gain: 0.13, cutoff: 600, pan: -0.08 });
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
      playChord(ctx, dest, start, chordA, 4.8, { waveform: "sine", gain: 0.15, cutoff: 1500, detuneStep: 3, pan: 0 });
      playTone(ctx, dest, start + 4.5, 392.00, 1.8, { waveform: "triangle", gain: 0.12, cutoff: 1800, pan: 0.2 });
      playChord(ctx, dest, start + 6.4, chordB, 4.8, { waveform: "sine", gain: 0.15, cutoff: 1500, detuneStep: 3, pan: 0 });
      playTone(ctx, dest, start + 12.0, 523.25, 1.2, { waveform: "sine", gain: 0.11, cutoff: 2000, pan: -0.2 });
    }
  },
  {
    id: "salon",
    title: "Salón Dorado",
    subtitle: "Pulso elegante y cámara",
    loopMs: 15000,
    perform(ctx, dest, start) {
      [110.00, 130.81, 146.83].forEach((freq, i) => {
        playTone(ctx, dest, start + i * 1.3, freq, 1.1, { waveform: "sawtooth", gain: 0.12, cutoff: 900, pan: -0.15 });
      });
      [220.00, 246.94, 261.63, 329.63, 261.63].forEach((freq, i) => {
        playTone(ctx, dest, start + 0.6 + i * 0.95, freq, 0.7, { waveform: "triangle", gain: 0.18, cutoff: 1700, pan: i % 2 ? 0.12 : -0.12 });
      });
      playChord(ctx, dest, start + 7.0, [293.66, 369.99, 440.00], 3.5, { waveform: "triangle", gain: 0.15, cutoff: 1700, detuneStep: 4, pan: 0 });
    }
  },
  {
    id: "tinta",
    title: "Tinta y Cobre",
    subtitle: "Campanas suaves y sombra baja",
    loopMs: 17000,
    perform(ctx, dest, start) {
      playTone(ctx, dest, start, 98.00, 4.0, { waveform: "sine", gain: 0.14, cutoff: 500, pan: -0.08 });
      playTone(ctx, dest, start + 1.2, 196.00, 0.5, { waveform: "square", gain: 0.10, cutoff: 2400, pan: 0.15 });
      playTone(ctx, dest, start + 3.2, 261.63, 0.7, { waveform: "triangle", gain: 0.14, cutoff: 1800, pan: -0.1 });
      playTone(ctx, dest, start + 6.6, 329.63, 0.9, { waveform: "triangle", gain: 0.13, cutoff: 1800, pan: 0.1 });
      playTone(ctx, dest, start + 10.0, 392.00, 0.6, { waveform: "sine", gain: 0.12, cutoff: 2200, pan: 0.2 });
    }
  },
  {
    id: "catedral",
    title: "Cúpula de Noche",
    subtitle: "Drone profundo y brillo lejano",
    loopMs: 20000,
    perform(ctx, dest, start) {
      playTone(ctx, dest, start, 65.41, 7.0, { waveform: "sine", gain: 0.14, cutoff: 420, pan: 0 });
      playTone(ctx, dest, start + 1.8, 130.81, 5.0, { waveform: "triangle", gain: 0.12, cutoff: 900, pan: -0.1 });
      playTone(ctx, dest, start + 4.0, 261.63, 2.0, { waveform: "sine", gain: 0.10, cutoff: 1600, pan: 0.12 });
      playTone(ctx, dest, start + 8.0, 523.25, 1.2, { waveform: "sine", gain: 0.10, cutoff: 2500, pan: -0.12 });
      playTone(ctx, dest, start + 12.0, 392.00, 1.0, { waveform: "triangle", gain: 0.11, cutoff: 1800, pan: 0.08 });
    }
  }
];

/* ------------------------------------------------------------
   STOPWORDS (Español) — para análisis de ideas
   ------------------------------------------------------------ */
const STOPWORDS = new Set([
  "a","acá","ahí","al","algo","algún","algunas","algunos","ante","antes","aquel","aquella","aquellas","aquellos","aquí","así","aun","aunque","bajo","bien",
  "cada","casi","como","con","contra","cosa","cual","cuales","cualquier","cuando","cuanto","de","del","desde","donde","dos","el","él","ella","ellas","ellos",
  "en","entre","era","éramos","eran","eras","eres","es","esa","esas","ese","eso","esos","esta","está","están","estaba","estaban","este","esto","estos","fue","fueron",
  "ha","han","hasta","hay","la","las","le","les","lo","los","más","me","mi","mí","mis","mucho","muy","ni","no","nos","nosotros","o","otro","otra","otros","otras",
  "para","pero","por","porque","pues","que","qué","quien","quién","se","sea","ser","si","sí","sin","sobre","su","sus","también","tan","tanto","te","ti","tiene",
  "tienen","todo","todos","toda","todas","tras","tu","tú","tus","un","una","uno","unos","unas","y","ya","yo","aún","ese","esta","más","cuándo","dónde","cómo","muy"
]);

/* ------------------------------------------------------------
   ESTADO GLOBAL
   ------------------------------------------------------------ */
let books = [];
let currentPDF = null;
let currentEpub = null;
let rendition = null;
let isEpub = false;
let currentPage = 1;
let currentText = "";
let currentBookTitle = "";
let currentBookId = "";
let pdfZoom = 1.0;
let epubFontPercent = 100;
let musicContext = null;
let musicMasterGain = null;
let musicCompressor = null;
let musicPlaying = false;
let musicLoopHandle = null;
let musicCurrentTrackId = localStorage.getItem("santuario_music_track") || MUSIC_TRACKS[0].id;
let musicVolume = clamp(Number(localStorage.getItem("santuario_music_volume") || "1.15"), 0.2, 2.0);
let selectedVoiceURI = localStorage.getItem("santuario_voice_uri") || "";
let voiceRate = clamp(Number(localStorage.getItem("santuario_voice_rate") || "0.95"), 0.8, 1.4);
let availableVoices = [];
let currentObjectUrl = null;
let readStartTime = Date.now();
let readingTimerHandle = null;

/* ------------------------------------------------------------
   REFS DOM
   ------------------------------------------------------------ */
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
  voiceRateSelect: $("voiceRateSelect"),
  progressBar: $("progressBar"),
  progressLabel: $("progressLabel"),
  readingClock: $("readingClock"),
  bookmarkBtn: $("bookmarkBtn"),
  bookmarkInfo: $("bookmarkInfo"),
  continueWrap: $("continueWrap"),
  continueGrid: $("continueGrid")
};

/* ------------------------------------------------------------
   UTILIDADES
   ------------------------------------------------------------ */
function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }
function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function escapeHtml(str) { return String(str).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
function escapeAttr(str) { return String(str).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }
function safeDecodePath(path) { try { return decodeURIComponent(path); } catch { return path; } }
function slugify(str) { return String(str).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,""); }

function formatClock(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${m}:${ss}` : `${m}:${ss}`;
}

function showLoader(text, subtext = "") {
  els.loaderText.textContent = text;
  els.loaderSubtext.textContent = subtext;
  els.loader.classList.remove("hidden");
}
function hideLoader() { els.loader.classList.add("hidden"); }

/* ------------------------------------------------------------
   NAVEGACIÓN ENTRE PANTALLAS
   ------------------------------------------------------------ */
function openReader(title) {
  els.home.classList.replace("activa", "oculta");
  els.readerScreen.classList.replace("oculta", "activa");
  els.title.textContent = title || "Lectura";
  closeModals();
  readStartTime = Date.now();
  startReadingTimer();
  updateProgressUI(0);
  updateBookmarkButton();
}

function goHome() {
  saveReadingState();
  stopVoice();
  stopMusic();
  cleanup();
  stopReadingTimer();
  els.readerScreen.classList.replace("activa", "oculta");
  els.home.classList.replace("oculta", "activa");
  closeModals();
  renderContinueSection();
}

function toggleSettings() { els.settingsModal.classList.toggle("hidden"); }
function closeIaModal() { els.iaModal.classList.add("hidden"); }
function closeModals() {
  els.settingsModal.classList.add("hidden");
  els.iaModal.classList.add("hidden");
}

function cleanup() {
  if (currentEpub && typeof currentEpub.destroy === "function") {
    try { currentEpub.destroy(); } catch (_) {}
  }
  if (currentObjectUrl) {
    try { URL.revokeObjectURL(currentObjectUrl); } catch (_) {}
  }
  currentPDF = null;
  currentEpub = null;
  rendition = null;
  isEpub = false;
  currentPage = 1;
  currentText = "";
  currentBookTitle = "";
  currentBookId = "";
  currentObjectUrl = null;
  els.readerDiv.innerHTML = "";
  els.readerDiv.style.fontSize = "22px";
  pdfZoom = 1.0;
  epubFontPercent = 100;
  updateProgressUI(0);
}

/* ------------------------------------------------------------
   UI: progreso, reloj, bookmark
   ------------------------------------------------------------ */
function updateProgressUI(percent) {
  const p = clamp(Math.round(percent), 0, 100);
  els.progressBar.value = String(p);
  els.progressLabel.textContent = `${p}%`;
}

function startReadingTimer() {
  stopReadingTimer();
  readingTimerHandle = setInterval(() => {
    els.readingClock.textContent = `⏱ ${formatClock(Date.now() - readStartTime)}`;
  }, 1000);
  els.readingClock.textContent = "⏱ 00:00";
}
function stopReadingTimer() {
  clearInterval(readingTimerHandle);
  readingTimerHandle = null;
  els.readingClock.textContent = "⏱ 00:00";
}

function updateBookmarkButton() {
  const bm = getBookmark(currentBookId);
  if (bm) {
    els.bookmarkBtn.classList.add("activo");
    els.bookmarkBtn.title = "Quitar señalador";
    const when = new Date(bm.savedAt || Date.now()).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
    els.bookmarkInfo.textContent = `📍 Señalador guardado: ${bm.progress}% · ${when}`;
  } else {
    els.bookmarkBtn.classList.remove("activo");
    els.bookmarkBtn.title = "Marcar señalador";
    els.bookmarkInfo.textContent = "";
  }
}

function toggleBookmark() {
  if (!currentBookId) return;
  const existing = getBookmark(currentBookId);
  if (existing) {
    localStorage.removeItem(`santuario_bookmark_${currentBookId}`);
  } else {
    const bm = {
      bookId: currentBookId,
      title: currentBookTitle,
      progress: Number(els.progressBar.value || 0),
      page: currentPage,
      isEpub,
      cfi: isEpub && rendition ? safeCurrentCfi() : null,
      savedAt: Date.now()
    };
    localStorage.setItem(`santuario_bookmark_${currentBookId}`, JSON.stringify(bm));
  }
  updateBookmarkButton();
}

function safeCurrentCfi() {
  try { return rendition.currentLocation()?.start?.cfi || null; } catch { return null; }
}

function getBookmark(bookId) {
  if (!bookId) return null;
  try {
    const raw = localStorage.getItem(`santuario_bookmark_${bookId}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

/* ------------------------------------------------------------
   MÚSICA: tablero y selección
   ------------------------------------------------------------ */
function renderMusicBoard() {
  els.musicBoard.innerHTML = MUSIC_TRACKS.map(track => `
    <button class="music-card ${track.id === musicCurrentTrackId ? "active" : ""}" onclick="selectMusic('${track.id}')">
      <span class="music-card-title">${escapeHtml(track.title)}</span>
      <span class="music-card-subtitle">${escapeHtml(track.subtitle)}</span>
    </button>
  `).join("");
  const selected = MUSIC_TRACKS.find(t => t.id === musicCurrentTrackId) || MUSIC_TRACKS[0];
  els.musicNow.textContent = selected
    ? (musicPlaying ? `♪ Sonando: ${selected.title}` : `Pieza seleccionada: ${selected.title}`)
    : "Toca una pieza para iniciarla.";
}

/* ------------------------------------------------------------
   VOCES
   ------------------------------------------------------------ */
function populateVoices() {
  const voices = speechSynthesis.getVoices() || [];
  if (!voices.length) {
    els.voiceSelect.innerHTML = `<option value="">Voz del sistema</option>`;
    return;
  }
  availableVoices = voices.slice().sort((a, b) => {
    const aEs = /^es/i.test(a.lang) ? 0 : 1;
    const bEs = /^es/i.test(b.lang) ? 0 : 1;
    return aEs - bEs || a.lang.localeCompare(b.lang) || a.name.localeCompare(b.name);
  });
  els.voiceSelect.innerHTML = availableVoices.map(v =>
    `<option value="${escapeAttr(v.voiceURI)}">${escapeHtml(v.name)} · ${escapeHtml(v.lang)}</option>`
  ).join("");
  const preferred = availableVoices.find(v => v.voiceURI === selectedVoiceURI)
    || availableVoices.find(v => /^es/i.test(v.lang))
    || availableVoices[0];
  if (preferred) {
    els.voiceSelect.value = preferred.voiceURI;
    selectedVoiceURI = preferred.voiceURI;
    localStorage.setItem("santuario_voice_uri", selectedVoiceURI);
  }
}

/* ------------------------------------------------------------
   BIBLIOTECA DINÁMICA DESDE GITHUB
   ------------------------------------------------------------ */
async function loadBooksFromGitHub() {
  const res = await fetch(GITHUB_API, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const files = await res.json();
  books = files
    .filter(f => f.type === "file" && /\.(epub|pdf)$/i.test(f.name))
    .map(f => {
      const cleanTitle = safeDecodePath(f.name.replace(/\.(epub|pdf)$/i, "").replace(/[_-]+/g, " ").trim());
      return {
        title: cleanTitle,
        file: f.download_url,
        type: f.name.toLowerCase().endsWith(".epub") ? "epub" : "pdf",
        id: slugify(cleanTitle)
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title, "es"));
}

function renderBooks() {
  if (!books.length) {
    els.bookGrid.innerHTML = `<p class="grid-msg">📭 No hay libros en /book. Cargá uno desde tu dispositivo abajo.</p>`;
    return;
  }
  els.bookGrid.innerHTML = books.map((b, i) => {
    const bm = getBookmark(b.id);
    const progressBar = bm
      ? `<div class="book-progress-mini"><span style="width:${bm.progress}%"></span></div>`
      : "";
    return `
      <button class="btn-book" onclick="loadRepoBook(${i})" title="${escapeAttr(b.title)}">
        <span class="book-icon">${b.type === "epub" ? "✑" : "▣"}</span>
        <div class="book-info">
          <div class="book-title">${escapeHtml(b.title)}</div>
          <div class="book-meta">${b.type.toUpperCase()}${bm ? ` · ${bm.progress}% leído` : ""}</div>
          ${progressBar}
        </div>
      </button>
    `;
  }).join("");
}

/* ------------------------------------------------------------
   SECCIÓN "CONTINUAR LECTURA"
   ------------------------------------------------------------ */
function getAllBookmarks() {
  const list = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("santuario_bookmark_")) {
      try {
        const data = JSON.parse(localStorage.getItem(k));
        if (data && data.title) list.push(data);
      } catch {}
    }
  }
  return list.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
}

function renderContinueSection() {
  const bookmarks = getAllBookmarks();
  if (!bookmarks.length) {
    els.continueWrap.classList.add("hidden");
    return;
  }
  els.continueWrap.classList.remove("hidden");
  els.continueGrid.innerHTML = bookmarks.slice(0, 6).map(bm => {
    const when = new Date(bm.savedAt || Date.now()).toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
    return `
      <button class="continue-card" onclick="continueFromBookmark('${escapeAttr(bm.bookId)}')">
        <span class="continue-title">${escapeHtml(bm.title)}</span>
        <span class="continue-meta">📍 ${bm.progress}% · ${when}</span>
      </button>
    `;
  }).join("");
}

function continueFromBookmark(bookId) {
  const idx = books.findIndex(b => b.id === bookId);
  if (idx >= 0) {
    loadRepoBook(idx);
  } else {
    alert("Este libro ya no está en la biblioteca. Cargalo localmente para continuar.");
  }
}

/* ------------------------------------------------------------
   INIT
   ------------------------------------------------------------ */
async function init() {
  renderMusicBoard();
  populateVoices();
  els.fileInput.addEventListener("change", handleLocalFile);
  els.musicVolume.addEventListener("input", () => setMusicVolume(Number(els.musicVolume.value)));
  els.voiceSelect.addEventListener("change", () => {
    selectedVoiceURI = els.voiceSelect.value;
    localStorage.setItem("santuario_voice_uri", selectedVoiceURI);
  });
  els.voiceRateSelect.addEventListener("change", () => {
    voiceRate = Number(els.voiceRateSelect.value);
    localStorage.setItem("santuario_voice_rate", String(voiceRate));
  });
  els.progressBar.addEventListener("input", onProgressSeek);
  window.addEventListener("resize", () => {
    if (isEpub && rendition) {
      try { rendition.resize(window.innerWidth, window.innerHeight); } catch (_) {}
    }
    if (!isEpub && currentPDF) {
      renderPDFPage().catch(() => {});
    }
  });

  speechSynthesis.onvoiceschanged = populateVoices;
  setTimeout(populateVoices, 400);

  try {
    await loadBooksFromGitHub();
  } catch (err) {
    console.warn("La API de GitHub no respondió. Biblioteca remota deshabilitada.", err);
    books = [];
  }
  renderBooks();
  renderContinueSection();
  setInitialSelectors();
}

function setInitialSelectors() {
  els.musicVolume.value = String(musicVolume);
  els.voiceRateSelect.value = String(voiceRate);
  if (selectedVoiceURI) {
    els.voiceSelect.value = selectedVoiceURI;
  }
  renderMusicBoard();
}

/* ------------------------------------------------------------
   CARGA DE LIBRO DESDE REPO
   ------------------------------------------------------------ */
async function loadRepoBook(index) {
  const book = books[index];
  if (!book) return;
  showLoader(`Abriendo ${book.type.toUpperCase()}…`, book.type === "epub" ? "Preparando el manuscrito…" : "");
  try {
    const response = await fetch(book.file, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = await response.arrayBuffer();
    currentBookId = book.id;
    if (book.type === "epub") {
      const blob = new Blob([buffer], { type: "application/epub+zip" });
      const url = URL.createObjectURL(blob);
      currentObjectUrl = url;
      await loadEpubFromUrl(url, book.title);
    } else {
      await loadPDF(buffer, book.title);
    }
    restoreBookmarkIfAny();
  } catch (err) {
    console.error(err);
    alert(`No se pudo abrir "${book.title}". Verifica que el archivo exista en /book/.`);
  } finally {
    hideLoader();
  }
}

async function handleLocalFile(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  showLoader("Procesando archivo local…", file.name.toLowerCase().endsWith(".epub") ? "Preparando EPUB…" : "Preparando PDF…");
  try {
    const buffer = await file.arrayBuffer();
    const name = file.name.toLowerCase();
    const cleanTitle = file.name.replace(/\.(epub|pdf)$/i, "").replace(/[_-]+/g, " ").trim();
    currentBookId = slugify(cleanTitle);
    if (name.endsWith(".epub")) {
      const blob = new Blob([buffer], { type: "application/epub+zip" });
      const url = URL.createObjectURL(blob);
      currentObjectUrl = url;
      await loadEpubFromUrl(url, cleanTitle);
    } else if (name.endsWith(".pdf") || file.type === "application/pdf") {
      await loadPDF(buffer, cleanTitle);
    } else {
      alert("Formato no compatible. Solo PDF o EPUB.");
    }
    restoreBookmarkIfAny();
  } catch (err) {
    console.error(err);
    alert("El archivo parece dañado o protegido.");
  } finally {
    hideLoader();
    els.fileInput.value = "";
  }
}

function restoreBookmarkIfAny() {
  const bm = getBookmark(currentBookId);
  if (!bm) return;
  const ok = confirm(`Tenés un señalador guardado en "${bm.title}" al ${bm.progress}%. ¿Continuar desde ahí?`);
  if (!ok) return;
  if (isEpub && rendition && bm.cfi) {
    try { rendition.display(bm.cfi); } catch (_) {}
  } else if (!isEpub && currentPDF && bm.page) {
    currentPage = clamp(bm.page, 1, currentPDF.numPages);
    renderPDFPage().catch(() => {});
  }
  updateProgressUI(bm.progress);
}

/* ------------------------------------------------------------
   EPUB: carga segura con espera de layout
   ------------------------------------------------------------ */
async function loadEpubFromUrl(url, title) {
  cleanup();
  isEpub = true;
  currentBookTitle = title;
  openReader(title);

  // CRÍTICO: Esperar a que el DOM tenga dimensiones reales.
  // Sin esto, epub.js entra en condición de carrera y no renderiza.
  await new Promise(r => requestAnimationFrame(() => r()));
  await wait(400);

  currentEpub = ePub(url);
  await currentEpub.ready;

  rendition = currentEpub.renderTo("reader", {
    width: "100%",
    height: Math.max(window.innerHeight - 200, 400),
    flow: "scrolled-doc",
    spread: "none",
    allowScriptedContent: false
  });

  if (rendition?.themes) {
    try {
      rendition.themes.default({
        body: {
          background: "#F4ECD8",
          color: "#2C1810",
          "font-family": "Cormorant Garamond, Georgia, serif",
          "line-height": "1.75",
          "padding": "0 12px"
        }
      });
      rendition.themes.fontSize(`${epubFontPercent}%`);
    } catch (_) {}
  }

  rendition.on("rendered", refreshVisibleText);
  rendition.on("relocated", (loc) => {
    refreshVisibleText();
    syncProgressFromEpub(loc);
    saveReadingState();
  });

  await rendition.display();
  refreshVisibleText();
  syncProgressFromEpub();
  saveReadingState();
  els.title.textContent = title;
}

function syncProgressFromEpub(loc) {
  try {
    const location = loc || rendition?.currentLocation();
    const pct = location?.start?.percentage;
    if (typeof pct === "number" && !isNaN(pct)) {
      updateProgressUI(pct * 100);
    }
  } catch (_) {}
}

function estimateEpubProgressFromSeek(percent) {
  if (!currentEpub || !rendition) return;
  try {
    const cfi = currentEpub.locations?.cfiFromPercentage?.(percent / 100);
    if (cfi) rendition.display(cfi);
  } catch (_) {}
}

/* ------------------------------------------------------------
   PDF
   ------------------------------------------------------------ */
async function loadPDF(buffer, title) {
  cleanup();
  isEpub = false;
  currentBookTitle = title;
  currentPDF = await pdfjsLib.getDocument({ data: buffer }).promise;
  currentPage = 1;
  openReader(title);
  await renderPDFPage();
  saveReadingState();
}

async function renderPDFPage() {
  if (!currentPDF) return;
  const page = await currentPDF.getPage(currentPage);
  const content = await page.getTextContent();
  currentText = content.items.map(item => item.str).join(" ").replace(/\s+/g, " ").trim();

  const baseScale = Math.max(1.0, Math.min(1.6, window.innerWidth / 760));
  const viewport = page.getViewport({ scale: baseScale * pdfZoom });
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  els.readerDiv.innerHTML = "";
  els.readerDiv.appendChild(canvas);
  await page.render({ canvasContext: ctx, viewport }).promise;

  const pct = currentPDF.numPages ? (currentPage / currentPDF.numPages) * 100 : 0;
  updateProgressUI(pct);
  saveReadingState();
  updateBookmarkButton();
}

/* ------------------------------------------------------------
   NAVEGACIÓN DE PÁGINAS
   ------------------------------------------------------------ */
function prevPage() {
  if (isEpub && rendition) { rendition.prev(); return; }
  if (currentPDF && currentPage > 1) {
    currentPage--;
    renderPDFPage().catch(() => {});
  }
}
function nextPage() {
  if (isEpub && rendition) { rendition.next(); return; }
  if (currentPDF && currentPage < currentPDF.numPages) {
    currentPage++;
    renderPDFPage().catch(() => {});
  }
}

/* ------------------------------------------------------------
   ZOOM
   ------------------------------------------------------------ */
function zoomIn() {
  if (isEpub) {
    epubFontPercent = clamp(epubFontPercent + 10, 80, 200);
    applyEpubFont();
  } else {
    pdfZoom = clamp(pdfZoom + 0.1, 0.6, 2.4);
    renderPDFPage().catch(() => {});
  }
  saveReadingState();
}
function zoomOut() {
  if (isEpub) {
    epubFontPercent = clamp(epubFontPercent - 10, 80, 200);
    applyEpubFont();
  } else {
    pdfZoom = clamp(pdfZoom - 0.1, 0.6, 2.4);
    renderPDFPage().catch(() => {});
  }
  saveReadingState();
}
function applyEpubFont() {
  if (rendition?.themes) {
    try { rendition.themes.fontSize(`${epubFontPercent}%`); } catch (_) {}
  }
}

/* ------------------------------------------------------------
   EXTRACCIÓN DE TEXTO VISIBLE
   ------------------------------------------------------------ */
function refreshVisibleText() {
  currentText = extractVisibleText();
}

function extractVisibleText() {
  if (isEpub && rendition) {
    try {
      const iframes = els.readerDiv.querySelectorAll("iframe");
      const parts = [];
      iframes.forEach(iframe => {
        try {
          const doc = iframe.contentDocument || iframe.contentWindow?.document;
          if (doc?.body) parts.push(doc.body.innerText || doc.body.textContent || "");
        } catch (_) {}
      });
      return parts.join("\n").replace(/\s+/g, " ").trim();
    } catch (_) { return ""; }
  }
  return currentText || "";
}

function onProgressSeek(e) {
  const value = Number(e.target.value);
  if (isEpub && rendition) {
    estimateEpubProgressFromSeek(value);
  } else if (currentPDF) {
    const targetPage = Math.max(1, Math.min(currentPDF.numPages, Math.round((value / 100) * currentPDF.numPages)));
    if (targetPage !== currentPage) {
      currentPage = targetPage;
      renderPDFPage().catch(() => {});
    }
  }
  updateProgressUI(value);
  saveReadingState();
}

/* ============================================================
   MOTOR DE MÚSICA — Web Audio API
   ============================================================ */
function getTrackById(id) {
  return MUSIC_TRACKS.find(track => track.id === id) || MUSIC_TRACKS[0];
}

async function ensureMusicContext() {
  if (!musicContext) {
    musicContext = new (window.AudioContext || window.webkitAudioContext)();
    musicCompressor = musicContext.createDynamicsCompressor();
    musicMasterGain = musicContext.createGain();
    musicCompressor.threshold.value = -24;
    musicCompressor.knee.value = 22;
    musicCompressor.ratio.value = 6;
    musicCompressor.attack.value = 0.004;
    musicCompressor.release.value = 0.25;
    musicMasterGain.gain.value = musicVolume;
    musicMasterGain.connect(musicCompressor);
    musicCompressor.connect(musicContext.destination);
  }
  if (musicContext.state === "suspended") {
    await musicContext.resume();
  }
  if (musicMasterGain) {
    musicMasterGain.gain.setTargetAtTime(musicVolume, musicContext.currentTime, 0.03);
  }
}

function setMusicVolume(value) {
  musicVolume = clamp(Number(value), 0.2, 2.0);
  localStorage.setItem("santuario_music_volume", String(musicVolume));
  if (musicMasterGain && musicContext) {
    musicMasterGain.gain.setTargetAtTime(musicVolume, musicContext.currentTime, 0.03);
  }
}

function playTone(ctx, destination, startTime, freq, duration, opts = {}) {
  const osc = ctx.createOscillator();
  osc.type = opts.waveform || "sine";
  osc.frequency.setValueAtTime(freq, startTime);

  const filter = ctx.createBiquadFilter();
  filter.type = opts.filter || "lowpass";
  filter.frequency.setValueAtTime(opts.cutoff || 1800, startTime);
  filter.Q.value = opts.q || 0.8;

  const gain = ctx.createGain();
  const peak = opts.gain ?? 0.14;
  const attack = opts.attack ?? 0.03;
  const release = opts.release ?? 0.28;

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), startTime + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration + release);

  osc.connect(filter);
  filter.connect(gain);

  if (ctx.createStereoPanner) {
    const panner = ctx.createStereoPanner();
    panner.pan.value = opts.pan || 0;
    gain.connect(panner);
    panner.connect(destination);
  } else {
    gain.connect(destination);
  }

  osc.start(startTime);
  osc.stop(startTime + duration + release + 0.05);
}

function playChord(ctx, destination, startTime, freqs, duration, opts = {}) {
  freqs.forEach((freq, index) => {
    playTone(ctx, destination, startTime + index * 0.015, freq, duration, opts);
  });
}

function stopMusic(updateButton = true) {
  musicPlaying = false;
  clearTimeout(musicLoopHandle);
  musicLoopHandle = null;
  if (musicContext && musicMasterGain) {
    try { musicMasterGain.gain.setTargetAtTime(0.0001, musicContext.currentTime, 0.02); } catch (_) {}
  }
  if (updateButton) {
    els.btnMusica.classList.remove("activo");
    els.btnMusica.setAttribute("aria-pressed", "false");
    renderMusicBoard();
  }
}

function scheduleMusic(track) {
  clearTimeout(musicLoopHandle);
  const loop = () => {
    if (!musicPlaying || !musicContext || !musicMasterGain) return;
    const start = musicContext.currentTime + 0.05;
    track.perform(musicContext, musicMasterGain, start);
    musicLoopHandle = setTimeout(loop, track.loopMs);
  };
  loop();
}

async function startMusic(trackId) {
  await ensureMusicContext();
  const track = getTrackById(trackId);
  if (!track) return;
  stopMusic(false);
  musicCurrentTrackId = track.id;
  localStorage.setItem("santuario_music_track", musicCurrentTrackId);
  musicPlaying = true;
  els.btnMusica.classList.add("activo");
  els.btnMusica.setAttribute("aria-pressed", "true");
  // Subir ganancia al volumen elegido (puede haber bajado al silenciar)
  if (musicMasterGain && musicContext) {
    musicMasterGain.gain.setTargetAtTime(musicVolume, musicContext.currentTime, 0.05);
  }
  renderMusicBoard();
  scheduleMusic(track);
}

async function toggleMusic() {
  // Crítico: este handler DEBE ser disparado por gesto del usuario (click).
  // Por eso ensureMusicContext() funciona aquí (resume() requiere gesto).
  const selectedId = musicCurrentTrackId || MUSIC_TRACKS[0].id;
  if (musicPlaying) {
    stopMusic();
    return;
  }
  await startMusic(selectedId);
}

async function selectMusic(id) {
  musicCurrentTrackId = id;
  localStorage.setItem("santuario_music_track", musicCurrentTrackId);
  await startMusic(id);
}

/* ============================================================
   VOZ NARRADORA
   ============================================================ */
function getVoice() {
  const voices = speechSynthesis.getVoices() || [];
  const selected = voices.find(v => v.voiceURI === els.voiceSelect.value);
  if (selected) return selected;
  return voices.find(v => /^es/i.test(v.lang)) || voices[0] || null;
}

async function playVoice() {
  let text = extractVisibleText();
  if (!text || text.length < 40) {
    await wait(180);
    text = extractVisibleText();
  }
  if (!text || text.length < 40) {
    alert("No hay suficiente texto visible para leer en voz alta.");
    return;
  }
  stopVoice();
  const utterance = new SpeechSynthesisUtterance(text.slice(0, 4000));
  const voice = getVoice();
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang || "es-AR";
  } else {
    utterance.lang = "es-AR";
  }
  utterance.rate = Number(els.voiceRateSelect.value || voiceRate || 0.95);
  utterance.pitch = 1.0;
  speechSynthesis.speak(utterance);
}
function stopVoice() { speechSynthesis.cancel(); }

/* ============================================================
   ✧ ANÁLISIS RACIONAL DE LECTURA
   ------------------------------------------------------------
   No copia frases sueltas. Pondera oraciones por:
   - longitud útil (no ruido)
   - densidad de palabras clave (keywords del texto)
   - posición (apertura y cierre pesan algo más)
   Devuelve: idea principal, ideas secundarias, palabras clave,
   interpretación y pregunta abierta para el lector.
   ============================================================ */
function analyzeText() {
  let text = extractVisibleText();
  if (!text || text.length < 120) {
    alert("Se necesita más texto visible en pantalla para generar el análisis.");
    return;
  }

  const sentences = segmentSentences(text);
  if (sentences.length < 2) {
    alert("Avanza un poco la lectura para tener más contenido que analizar.");
    return;
  }

  const keywords = topKeywords(text, 8);
  const ranked = rankSentencesBySemantic(sentences, keywords);

  const mainIdea = shortenSentence(ranked[0]?.sentence || sentences[0]);
  const secondaryIdeas = ranked.slice(1, 4)
    .map(r => shortenSentence(r.sentence))
    .filter(s => s && s !== mainIdea);

  const interpretation = buildInterpretation(mainIdea, secondaryIdeas, keywords);
  const question = buildQuestion(keywords, mainIdea);

  els.iaContent.innerHTML = `
    <h4>Idea principal</h4>
    <p>${escapeHtml(mainIdea)}</p>

    <h4>Ideas secundarias</h4>
    ${secondaryIdeas.length
      ? `<ul>${secondaryIdeas.map(s => `<li>${escapeHtml(s)}</li>`).join("")}</ul>`
      : `<p>No se detectaron ideas secundarias claras en el fragmento visible. Avanza la lectura para enriquecer el análisis.</p>`
    }

    <h4>Palabras clave</h4>
    <div class="ia-keywords">
      ${keywords.length
        ? keywords.map(k => `<span class="ia-keyword">${escapeHtml(k)}</span>`).join("")
        : `<span class="ia-keyword">sin clave dominante</span>`
      }
    </div>

    <h4>Interpretación</h4>
    <p>${escapeHtml(interpretation)}</p>

    <h4>Pregunta para el lector</h4>
    <p>${escapeHtml(question)}</p>
  `;
  els.iaModal.classList.remove("hidden");
}

/* ---- Algoritmos del análisis ---- */
function segmentSentences(text) {
  const clean = String(text).replace(/\s+/g, " ").trim();
  if (!clean) return [];
  if (window.Intl && Intl.Segmenter) {
    return Array.from(new Intl.Segmenter("es", { granularity: "sentence" }).segment(clean))
      .map(s => s.segment.trim())
      .filter(s => s && s.length > 25 && s.length < 400);
  }
  return (clean.match(/[^.!?]+[.!?]+/g) || [clean])
    .map(s => s.trim())
    .filter(s => s && s.length > 25 && s.length < 400);
}

function topKeywords(text, limit = 8) {
  const words = String(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length > 3 && !STOPWORDS.has(w));

  const freq = new Map();
  for (const w of words) {
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

function rankSentencesBySemantic(sentences, keywords) {
  const total = sentences.length;
  return sentences.map((sentence, idx) => {
    const lower = sentence.toLowerCase();
    let score = 0;
    // Densidad de keywords
    for (const k of keywords) {
      const matches = lower.match(new RegExp(`\\b${k}\\b`, "g"));
      if (matches) score += matches.length * 2;
    }
    // Longitud útil (penalizar muy cortas o muy largas)
    const len = sentence.length;
    if (len >= 60 && len <= 260) score += 1.5;
    // Bonus de apertura/cierre
    if (idx === 0 || idx === total - 1) score += 0.5;
    return { sentence, score, idx };
  }).sort((a, b) => b.score - a.score || a.idx - b.idx);
}

function shortenSentence(sentence, max = 220) {
  const clean = String(sentence || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).trimEnd() + "…";
}

function buildInterpretation(mainIdea, secondaryIdeas, keywords) {
  const focus = keywords.slice(0, 3).join(", ") || "la voz, el silencio y la mirada";
  const partes = [];
  partes.push(`El fragmento gira en torno a ${focus}.`);
  if (mainIdea) {
    partes.push(`La idea central propone una afirmación que organiza el resto del texto.`);
  }
  if (secondaryIdeas.length) {
    partes.push(`Alrededor aparecen capas que matizan, contradicen o profundizan esa afirmación, sosteniendo el ritmo de la lectura.`);
  }
  partes.push(`Como acompañante de lectura, se sugiere observar no solo lo que el texto afirma sino también lo que omite, repite o insinúa.`);
  return partes.join(" ");
}

function buildQuestion(keywords, mainIdea) {
  if (keywords.length >= 2) {
    return `¿Cómo cambia tu lectura si entendés ${keywords[0]} no como un concepto suelto, sino en relación con ${keywords[1]}?`;
  }
  if (keywords.length === 1) {
    return `¿Qué se desplaza en el texto si "${keywords[0]}" se entiende como su núcleo silencioso?`;
  }
  return `¿Qué sentido se abre si este fragmento se lee como escena y no solo como información?`;
}

/* ============================================================
   PERSISTENCIA DEL ESTADO DE LECTURA
   ============================================================ */
function saveReadingState() {
  if (!currentBookId) return;
  const state = {
    title: currentBookTitle,
    bookId: currentBookId,
    isEpub,
    currentPage,
    pdfZoom,
    epubFontPercent,
    progress: Number(els.progressBar.value || 0),
    savedAt: Date.now()
  };
  localStorage.setItem(`santuario_state_${currentBookId}`, JSON.stringify(state));
}

function loadSavedState(bookId) {
  if (!bookId) return null;
  try {
    return JSON.parse(localStorage.getItem(`santuario_state_${bookId}`) || "null");
  } catch {
    return null;
  }
}

function applySavedState() {
  const state = loadSavedState(currentBookId);
  if (!state) return;
  if (typeof state.pdfZoom === "number") pdfZoom = state.pdfZoom;
  if (typeof state.epubFontPercent === "number") epubFontPercent = state.epubFontPercent;
  if (typeof state.progress === "number") updateProgressUI(state.progress);
  if (isEpub) applyEpubFont();
}

window.addEventListener("beforeunload", () => {
  saveReadingState();
});

/* ============================================================
   BOOTSTRAP
   ============================================================ */
speechSynthesis.onvoiceschanged = populateVoices;
setTimeout(populateVoices, 400);
init().then(() => {
  applySavedState();
  setInitialSelectors();
});
