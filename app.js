pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Limpiar la URL si tiene parámetros de tracking
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

// Respaldo manual con los nombres EXACTOS de los libros en /book
const BOOKS_FALLBACK = [
  { title: "Zensorialmente", file: "book/Zensorialmente_Estanislao_Bachrach.epub", type: "epub" },
  { title: "Anatomía de un esquema Ponzi", file: "book/Anatomía de un esquema Ponzi Estafas pasadas y presentes (Colleen Cross) (Z-Library).epub", type: "epub" }
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
let currentFont = 28;
let epubFontPercent = 100;
let currentBookTitle = "";
let musicAudio = null;
let lastMusicIndex = Number(localStorage.getItem("santuario_music_index") || 0);

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

function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function escapeHtml(str) {
  return String(str).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

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
  els.musicSelect.innerHTML = MUSIC_TRACKS.map((t, i) => `<option value="${i}">${t.title}</option>`).join("");
  els.musicSelect.value = String(lastMusicIndex);
}

function cleanup() {
  if (currentEpub && typeof currentEpub.destroy === "function") {
    try { currentEpub.destroy(); } catch (_) {}
  }
  currentPDF = null;
  currentEpub = null;
  rendition = null;
  isEpub = false;
  currentPage = 1;
  currentText = "";
  els.readerDiv.innerHTML = "";
  els.readerDiv.style.fontSize = `${currentFont}px`;
}

async function init() {
  renderMusicOptions();
  els.fileInput.addEventListener("change", handleLocalFile);
  window.addEventListener("resize", () => {
    if (isEpub && rendition) {
      try { rendition.resize(window.innerWidth, window.innerHeight); } catch (_) {}
    }
  });

  // Intenta cargar desde la API; si falla, usa el respaldo exacto.
  try {
    await loadBooksFromGitHub();
  } catch (err) {
    console.warn("Usando catálogo de respaldo porque la API no respondió.", err);
    books = BOOKS_FALLBACK;
  }
  renderBooks();
}

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
    <button class="btn-book" onclick="loadRepoBook(${i})" title="${escapeHtml(b.title)}">
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
  showLoader(`Abriendo ${book.type.toUpperCase()}…`, book.type === "epub" ? "La carga puede tardar unos segundos." : "");

  try {
    const response = await fetch(book.file, { cache: "no-store" });
    if (!response.ok) throw new Error(`Error ${response.status}`);
    const buffer = await response.arrayBuffer();

    if (book.type === "epub") {
      const blob = new Blob([buffer], { type: "application/epub+zip" });
      const url = URL.createObjectURL(blob);
      await loadEpubFromUrl(url, book.title);
    } else {
      await loadPDF(buffer, book.title);
    }
  } catch (err) {
    console.error(err);
    alert(`No se pudo abrir "${book.title}". Verifica que el archivo exista en /book/ y que el nombre sea exacto.`);
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

    if (name.endsWith(".epub")) {
      const blob = new Blob([buffer], { type: "application/epub+zip" });
      const url = URL.createObjectURL(blob);
      await loadEpubFromUrl(url, file.name);
    } else if (name.endsWith(".pdf") || file.type === "application/pdf") {
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
  await wait(200);

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

  const scale = Math.max(1.15, Math.min(1.72, window.innerWidth / 700));
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  canvas.style.display = "block";
  canvas.style.margin = "0 auto";
  canvas.style.maxWidth = "100%";
  canvas.style.height = "auto";
  canvas.style.borderRadius = "14px";

  await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;

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
  return (currentText || "").trim();
}

function toggleMusic() {
  const trackIndex = Number(els.musicSelect.value || lastMusicIndex || 0);
  const track = MUSIC_TRACKS[trackIndex];
  if (!track) return;

  lastMusicIndex = trackIndex;
  localStorage.setItem("santuario_music_index", String(lastMusicIndex));

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
  const climax = (sentences[Math.floor(sentences.length / 2)] || "").trim();

  const themeLine = keywords.length
    ? `Las ideas que más insistencia muestran son: ${keywords.join(", ")}.`
    : "La página deja una sensación de tensión y memoria.";

  const question = `¿Qué cambia en esta página cuando la lees como conflicto, como memoria o como advertencia, en lugar de verla solo como información?`;

  els.iaContent.innerHTML = `
    <h4>Eje temático</h4>
    <p>${escapeHtml(themeLine)}</p>
    <h4>Premisa</h4>
    <p>${escapeHtml(first || "La escena inicial deja una impresión de expectativa y cuidado.")}</p>
    <h4>Clímax argumental</h4>
    <p>${escapeHtml(climax || "La tensión central se despliega y deja una marca en el lector.")}</p>
    <h4>Pregunta para el lector</h4>
    <p>${escapeHtml(question)}</p>
  `;
  els.iaModal.classList.remove("hidden");
}

function segmentSentences(text) {
  const clean = String(text).replace(/\s+/g, " ").trim();
  if (!clean) return [];
  if (window.Intl && Intl.Segmenter) {
    return Array.from(new Intl.Segmenter("es", { granularity: "sentence" }).segment(clean))
      .map(s => s.segment.trim())
      .filter(Boolean);
  }
  return clean.match(/[^.!?]+[.!?]+/g) || [clean];
}

function topKeywords(text, limit = 5) {
  const words = String(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length > 3 && !STOPWORDS.has(w));

  const freq = new Map();
  for (const w of words) freq.set(w, (freq.get(w) || 0) + 1);

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

init();
