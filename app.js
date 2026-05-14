pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Limpiar parámetros de tracking como ?utm_source=chatgpt.com
if (location.search) {
  history.replaceState({}, "", location.pathname);
}

const REPO_OWNER = "CarlosMazzu06";
const REPO_NAME = "lector-app";
const BOOK_FOLDER = "book";
const GITHUB_API = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${BOOK_FOLDER}`;

const MUSIC_TRACKS = [
  { title: "Vivaldi – La Primavera", url: "https://archive.org/download/VivaldiFourSeasonsTheSpring/Vivaldi%20-%20The%20Four%20Seasons%2C%20Spring.mp3" },
  { title: "Beethoven – Claro de Luna", url: "https://archive.org/download/MoonlightSonata_755/Beethoven-MoonlightSonata.mp3" },
  { title: "Chopin – Nocturno Op.9", url: "https://archive.org/download/ChopinNocturneOp9No2_201705/Chopin%20-%20Nocturne%20op.9%20No.2.mp3" }
];

// Palabras de parada para el análisis de palabras clave
const STOPWORDS = new Set([
  "a", "acá", "ahí", "al", "algo", "algunas", "algunos", "ante", "antes", "aquí", "así", "aun", "aunque",
  "bajo", "bien", "como", "con", "contra", "cual", "cuales", "cuando", "de", "del", "desde", "donde",
  "dos", "el", "ella", "ellas", "ellos", "en", "entre", "era", "eran", "es", "esa", "esas", "ese", "eso",
  "esos", "esta", "estaba", "estaban", "este", "esto", "estos", "fue", "ha", "han", "hay", "la", "las",
  "le", "les", "lo", "los", "más", "me", "mi", "mis", "mucho", "muy", "no", "nos", "o", "para", "pero",
  "por", "porque", "que", "qué", "se", "si", "sin", "sobre", "su", "sus", "también", "te", "tiene",
  "tienen", "todo", "un", "una", "uno", "unos", "unas", "y", "ya", "yo", "sus", "entre", "ser", "como",
  "hay", "dentro", "fuera", "mientras", "según", "sobre", "tras", "tanto", "sin", "cada", "casi", "todo",
  "toda"
]);

let books = [];
let currentPDF = null;
let currentEpub = null;
let rendition = null;
let isEpub = false;
let currentPage = 1;
let currentText = "";
let currentFont = 28;
let epubFontPercent = 100;
let currentBookTitle = "";
let musicAudio = null;
let currentObjectUrl = null;
let lastMusicIndex = 0;

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
  musicSelect: $("musicSelect")
};

/* ── Utilidades ── */
function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function showLoader(text, subtext = "") {
  els.loaderText.textContent = text;
  els.loaderSubtext.textContent = subtext;
  els.loader.classList.remove("hidden");
}
function hideLoader() { els.loader.classList.add("hidden"); }

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function openReader(title) {
  els.home.classList.replace("activa", "oculta");
  els.readerScreen.classList.replace("oculta", "activa");
  els.title.textContent = title || "Lectura";
  closeModals();
}

function goHome() {
  stopVoice();
  stopMusic();
  cleanup();
  els.readerScreen.classList.replace("activa", "oculta");
  els.home.classList.replace("oculta", "activa");
  closeModals();
}

function toggleSettings() { els.settingsModal.classList.toggle("hidden"); }
function closeIaModal() { els.iaModal.classList.add("hidden"); }
function closeModals() {
  els.settingsModal.classList.add("hidden");
  els.iaModal.classList.add("hidden");
}

function renderMusicOptions() {
  els.musicSelect.innerHTML = MUSIC_TRACKS
    .map((t, i) => `<option value="${i}">${t.title}</option>`)
    .join("");
  els.musicSelect.value = String(lastMusicIndex);
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
  currentObjectUrl = null;
  currentBookTitle = "";
  els.readerDiv.innerHTML = "";
  els.readerDiv.style.fontSize = `${currentFont}px`;
}

/* ── Inicialización ── */
async function init() {
  renderMusicOptions();
  els.fileInput.addEventListener("change", handleLocalFile);
  window.addEventListener("resize", () => {
    if (isEpub && rendition) {
      try { rendition.resize(window.innerWidth, window.innerHeight); } catch (_) {}
    }
  });

  // Cargar libros: intenta la API de GitHub, si falla usa una lista local de respaldo
  try {
    await loadBooksFromGitHub();
  } catch {
    console.warn("Usando catálogo de respaldo porque la API de GitHub no respondió.");
    books = BOOKS_FALLBACK;
  }
  renderBooks();
}

// Lista de respaldo en caso de fallo de la API (mismo nombre que en /book)
const BOOKS_FALLBACK = [
  { title: "Zensorialmente", file: "book/Zensorialmente_Estanislao_Bachrach.epub", type: "epub" },
  { title: "Departamento en Venta", file: "book/Departamento_en_Venta.pdf", type: "pdf" }
];

async function loadBooksFromGitHub() {
  const res = await fetch(GITHUB_API, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const files = await res.json();
  books = files
    .filter(f => f.type === "file" && /\.(epub|pdf)$/i.test(f.name))
    .map(f => ({
      title: f.name.replace(/\.(epub|pdf)$/i, "").replace(/[_-]+/g, " ").trim(),
      file: f.download_url,
      type: f.name.toLowerCase().endsWith(".epub") ? "epub" : "pdf"
    }))
    .sort((a, b) => a.title.localeCompare(b.title, "es"));
}

function renderBooks() {
  if (!books.length) {
    els.bookGrid.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:var(--pergamino-oscuro);">No se encontraron libros en /book.</p>`;
    return;
  }
  els.bookGrid.innerHTML = books.map((b, i) => `
    <button class="btn-book" onclick="loadRepoBook(${i})" title="${b.title}">
      <span class="book-icon">${b.type === "epub" ? "✑" : "▣"}</span>
      <div>
        <div class="book-title">${escapeHtml(b.title)}</div>
        <div class="book-meta">${b.type.toUpperCase()}</div>
      </div>
    </button>
  `).join("");
}

async function loadRepoBook(index) {
  const book = books[index];
  if (!book) return;
  const estimate = book.type === "epub" ? "Puede tardar entre 2 y 8 segundos." : "Abriendo al instante.";
  showLoader(`Abriendo ${book.type.toUpperCase()}…`, estimate);

  try {
    if (book.type === "epub") {
      // Si el archivo viene de la API, su URL es de descarga; si es del fallback, usamos fetch directo
      const url = book.file.startsWith("http") ? book.file : book.file;
      if (book.file.startsWith("http")) {
        const response = await fetch(book.file, { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        currentObjectUrl = URL.createObjectURL(blob);
        await loadEpubFromUrl(currentObjectUrl, book.title);
      } else {
        // archivo local (respaldo)
        await loadEpubFromUrl(book.file, book.title);
      }
    } else {
      const response = await fetch(book.file, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const buffer = await response.arrayBuffer();
      await loadPDF(buffer, book.title);
    }
  } catch (err) {
    console.error(err);
    alert(`Error al abrir "${book.title}". Verifica que el archivo exista en /book/ y que el nombre sea exacto.`);
  } finally {
    hideLoader();
  }
}

async function handleLocalFile(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  showLoader("Procesando archivo local…", file.name.toLowerCase().endsWith(".epub") ? "Preparando EPUB…" : "Preparando PDF…");

  try {
    if (file.name.toLowerCase().endsWith(".epub")) {
      const url = URL.createObjectURL(file);
      currentObjectUrl = url;
      await loadEpubFromUrl(url, file.name);
    } else if (file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf") {
      const buffer = await file.arrayBuffer();
      await loadPDF(buffer, file.name);
    } else {
      alert("Formato no compatible. Solo PDF o EPUB.");
    }
  } catch (err) {
    console.error(err);
    alert("El archivo parece dañado o protegido.");
  } finally {
    hideLoader();
    els.fileInput.value = "";
  }
}

async function loadEpubFromUrl(url, title) {
  cleanup();
  isEpub = true;
  currentBookTitle = title;
  openReader(title);
  await wait(180);

  currentEpub = ePub(url);
  await currentEpub.ready;

  rendition = currentEpub.renderTo("reader", {
    width: "100%",
    height: Math.max(window.innerHeight - 130, 400),
    flow: "scrolled-doc",
    spread: "none"
  });

  if (rendition?.themes) {
    try {
      rendition.themes.default({
        body: {
          "background": "#F4ECD8",
          "color": "#2C1810",
          "font-family": "Cormorant Garamond, serif",
          "line-height": "1.8"
        }
      });
    } catch (_) {}
  }

  rendition.on("rendered", refreshVisibleText);
  rendition.on("relocated", refreshVisibleText);
  await rendition.display();
  applyEpubFont();
  refreshVisibleText();
  els.title.textContent = title;
}

async function loadPDF(buffer, title) {
  cleanup();
  isEpub = false;
  currentBookTitle = title;
  currentPDF = await pdfjsLib.getDocument({ data: buffer }).promise;
  currentPage = 1;
  openReader(title);
  await renderPDFPage();
  applyFontSize();
}

async function renderPDFPage() {
  if (!currentPDF) return;
  const page = await currentPDF.getPage(currentPage);
  const content = await page.getTextContent();
  currentText = content.items.map(item => item.str).join(" ").replace(/\s+/g, " ").trim();

  const scale = Math.max(1.2, Math.min(1.8, window.innerWidth / 680));
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  canvas.style.display = "block";
  canvas.style.margin = "0 auto";
  canvas.style.maxWidth = "100%";
  canvas.style.height = "auto";
  canvas.style.borderRadius = "14px";
  canvas.style.boxShadow = "0 12px 30px rgba(0,0,0,0.10)";

  const ctx = canvas.getContext("2d");
  await page.render({ canvasContext: ctx, viewport }).promise;

  els.readerDiv.innerHTML = "";
  els.readerDiv.appendChild(canvas);
  els.readerContainer.scrollTop = 0;
  els.title.textContent = `${currentBookTitle} · Pág. ${currentPage}`;
}

function refreshVisibleText() {
  setTimeout(() => {
    if (!isEpub) return;
    try {
      const iframe = document.querySelector("#reader iframe");
      const doc = iframe?.contentDocument || iframe?.contentWindow?.document;
      const text = doc?.body?.innerText?.replace(/\s+/g, " ").trim();
      if (text) currentText = text;
    } catch (_) {}
  }, 350);
}

function applyFontSize() {
  if (isEpub && rendition?.themes) {
    try { rendition.themes.fontSize(`${epubFontPercent}%`); } catch (_) {}
  } else {
    els.readerDiv.style.fontSize = `${currentFont}px`;
  }
}
function applyEpubFont() {
  if (rendition?.themes) {
    try { rendition.themes.fontSize(`${epubFontPercent}%`); } catch (_) {}
  }
}

async function nextPage() {
  stopVoice();
  if (isEpub && rendition) {
    await rendition.next();
    refreshVisibleText();
  } else if (currentPDF && currentPage < currentPDF.numPages) {
    currentPage++;
    await renderPDFPage();
  }
}
async function prevPage() {
  stopVoice();
  if (isEpub && rendition) {
    await rendition.prev();
    refreshVisibleText();
  } else if (currentPDF && currentPage > 1) {
    currentPage--;
    await renderPDFPage();
  }
}

function zoomIn() { currentFont = Math.min(currentFont + 4, 54); epubFontPercent = Math.min(epubFontPercent + 8, 180); applyFontSize(); }
function zoomOut() { currentFont = Math.max(currentFont - 4, 22); epubFontPercent = Math.max(epubFontPercent - 8, 80); applyFontSize(); }

function getActiveText() {
  const selection = window.getSelection?.().toString().trim() || "";
  if (selection.length > 12) return selection;
  if (isEpub) return currentText?.trim() || "";
  return currentText?.trim() || "";
}

function toggleMusic() {
  const trackIndex = Number(els.musicSelect.value || lastMusicIndex || 0);
  const track = MUSIC_TRACKS[trackIndex];
  if (!track) return;
  lastMusicIndex = trackIndex;

  if (!musicAudio || musicAudio.src !== track.url) {
    stopMusic(false);
    musicAudio = new Audio(track.url);
    musicAudio.loop = true;
    musicAudio.volume = 0.22;
  }

  if (musicAudio.paused) {
    musicAudio.play()
      .then(() => els.btnMusica.classList.add("activo"))
      .catch(() => alert("El navegador bloqueó la música. Toca el botón otra vez."));
  } else {
    stopMusic();
  }
}
function stopMusic(updateButton = true) {
  try {
    if (musicAudio) {
      musicAudio.pause();
      musicAudio.currentTime = 0;
    }
    if (updateButton) els.btnMusica.classList.remove("activo");
  } catch (_) {}
}

function playVoice() {
  const text = getActiveText();
  if (!text || text.length < 40) {
    alert("No hay suficiente texto visible para leer en voz alta.");
    return;
  }
  stopVoice();
  const utterance = new SpeechSynthesisUtterance(text.slice(0, 4000));
  utterance.lang = "es-AR";
  utterance.rate = 0.92;
  utterance.pitch = 1.0;
  speechSynthesis.speak(utterance);
}
function stopVoice() { speechSynthesis.cancel(); }

function summarizeText() {
  const text = getActiveText();
  if (!text || text.length < 120) {
    alert("Se necesita más texto visible para generar una reflexión.");
    return;
  }

  const sentences = segmentSentences(text);
  const keywords = topKeywords(text, 6);
  const first = (sentences[0] || "").trim();
  const middle = (sentences[Math.floor(sentences.length / 2)] || "").trim();
  const last = (sentences[sentences.length - 1] || "").trim();

  const themeLine = keywords.length
    ? `Las ideas que más insistencia muestran son: ${keywords.join(", ")}.`
    : "La página deja una sensación de tensión, memoria y continuidad.";

  const interpretation = buildInterpretation(first, middle, last, keywords);

  els.iaContent.innerHTML = `
    <h4>Núcleo</h4>
    <p>${escapeHtml(first || "La lectura abre una escena de enfoque y expectativa.")}</p>
    <h4>Presencias recurrentes</h4>
    <p>${escapeHtml(themeLine)}</p>
    <h4>Interpretación</h4>
    <p>${escapeHtml(interpretation)}</p>
    <h4>Pregunta para continuar</h4>
    <p>¿Qué cambia en esta página cuando la lees como conflicto, como memoria o como advertencia?</p>
    <h4>Eco final</h4>
    <p>${escapeHtml(last || "El cierre deja una vibración abierta, lista para seguir pensando.")}</p>
  `;
  els.iaModal.classList.remove("hidden");
}

function segmentSentences(text) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  if (window.Intl && Intl.Segmenter) {
    return Array.from(new Intl.Segmenter("es", { granularity: "sentence" }).segment(clean))
      .map(s => s.segment.trim())
      .filter(Boolean);
  }
  return clean.match(/[^.!?]+[.!?]+/g) || [clean];
}

function topKeywords(text, limit = 5) {
  const words = text
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

function buildInterpretation(first, middle, last, keywords) {
  const key = keywords.length ? keywords.slice(0, 3).join(", ") : "la memoria, la duda y la forma";
  const parts = [];
  if (first) parts.push(`La apertura sugiere un marco inicial ligado a ${key}.`);
  if (middle) parts.push(`En el centro aparece una tensión que conviene leer con pausa, porque desplaza el sentido literal hacia una capa más humana.`);
  if (last) parts.push(`El cierre no clausura: deja una resonancia que invita a seguir interpretando desde la experiencia del lector.`);
  parts.push(`Como acompañante de lectura, la página pide observar no solo lo que dice, sino también lo que omite, repite o deja insinuado.`);
  return parts.join(" ");
}

init();
