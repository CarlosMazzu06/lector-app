pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const REPO_OWNER = "CarlosMazzu06";
const REPO_NAME = "lector-app";
const BOOK_FOLDER = "book";
const API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${BOOK_FOLDER}`;

const MUSIC_TRACKS = [
  { title: "Vivaldi – La Primavera", url: "https://archive.org/download/VivaldiFourSeasonsTheSpring/Vivaldi%20-%20The%20Four%20Seasons%2C%20Spring.mp3" },
  { title: "Beethoven – Claro de Luna", url: "https://archive.org/download/MoonlightSonata_755/Beethoven-MoonlightSonata.mp3" },
  { title: "Chopin – Nocturno Op.9", url: "https://archive.org/download/ChopinNocturneOp9No2_201705/Chopin%20-%20Nocturne%20op.9%20No.2.mp3" }
];

let books = [];
let currentPDF = null, currentEpub = null, rendition = null;
let isEpub = false, currentPage = 1, currentText = "", currentFont = 28, epubFontPercent = 100;
let currentBookTitle = "", currentObjectUrl = "";
let musicAudio = null;

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

init();

async function init() {
  renderMusicOptions();
  els.fileInput.addEventListener("change", handleLocalFile);
  window.addEventListener("resize", () => {
    if (isEpub && rendition) rendition.resize(window.innerWidth, window.innerHeight);
  });
  await loadBooksFromRepo();
  renderBooks();
}

function renderMusicOptions() {
  els.musicSelect.innerHTML = MUSIC_TRACKS.map((t, i) => `<option value="${i}">${t.title}</option>`).join("");
}

async function loadBooksFromRepo() {
  try {
    const res = await fetch(API_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const files = await res.json();
    books = files
      .filter(f => f.type === "file" && /\.(epub|pdf)$/i.test(f.name))
      .map(f => ({
        title: f.name.replace(/\.(epub|pdf)$/i, "").replace(/[_-]/g, " ").trim(),
        file: f.download_url,
        type: f.name.toLowerCase().endsWith(".epub") ? "epub" : "pdf"
      }))
      .sort((a, b) => a.title.localeCompare(b.title, "es"));
  } catch (err) {
    console.error(err);
    books = [];
    showLoader("No pude acceder a la biblioteca del repositorio.");
    els.loaderSubtext.textContent = "Verifica que la carpeta book exista y que el repositorio sea público.";
    setTimeout(hideLoader, 2500);
  }
}

function renderBooks() {
  if (!books.length) {
    els.bookGrid.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:var(--pergamino-oscuro);">Ningún libro encontrado en /book.</p>`;
    return;
  }
  els.bookGrid.innerHTML = books.map((b, i) => `
    <button class="btn-book" onclick="loadRepoBook(${i})">
      <span class="book-icon">${b.type === "epub" ? "✑" : "▣"}</span>
      <div>
        <div class="book-title">${b.title}</div>
        <div class="book-meta">${b.type.toUpperCase()}</div>
      </div>
    </button>
  `).join("");
}

async function loadRepoBook(index) {
  const book = books[index];
  if (!book) return;

  showLoader(`Abriendo ${book.type.toUpperCase()}…`);
  els.loaderSubtext.textContent = book.type === "epub" ? "EPUB: descomprimiendo y maquetando (5–20 s)" : "";

  try {
    if (book.type === "epub") {
      const response = await fetch(book.file, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      await loadEpubFromUrl(url, book.title);
    } else {
      const response = await fetch(book.file, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const buffer = await response.arrayBuffer();
      await loadPDF(buffer, book.title);
    }
  } catch (err) {
    alert(`No se pudo abrir "${book.title}". Verifica que el archivo exista en /book.`);
  } finally {
    hideLoader();
  }
}

async function handleLocalFile(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  showLoader("Procesando archivo local…");
  try {
    if (file.name.toLowerCase().endsWith(".epub")) {
      const url = URL.createObjectURL(file);
      await loadEpubFromUrl(url, file.name, true);
    } else if (file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf") {
      const buffer = await file.arrayBuffer();
      await loadPDF(buffer, file.name);
    } else {
      alert("Formato no compatible. Solo PDF o EPUB.");
      hideLoader();
    }
  } catch (err) {
    alert("Archivo dañado o protegido.");
    hideLoader();
  } finally {
    els.fileInput.value = "";
  }
}

async function loadEpubFromUrl(url, title, isLocal = false) {
  cleanup();
  isEpub = true;
  currentBookTitle = title;
  currentObjectUrl = isLocal ? url : "";
  openReader(title);

  await new Promise(resolve => setTimeout(resolve, 220));

  currentEpub = ePub(url);
  await currentEpub.ready;

  rendition = currentEpub.renderTo("reader", {
    width: "100%",
    height: Math.max(window.innerHeight - 92, 400),
    flow: "scrolled-doc",
    spread: "none"
  });

  rendition.themes.default({
    body: {
      background: "#F4ECD8",
      color: "#2C1810",
      "font-family": "Cormorant Garamond, serif",
      "line-height": "1.8"
    }
  });

  rendition.on("rendered", updateTextFromEpub);
  rendition.on("relocated", updateTextFromEpub);

  await rendition.display();
  applyEpubFont();
  updateTextFromEpub();
  els.title.textContent = title;

  if (isLocal) {
    setTimeout(() => {
      try { URL.revokeObjectURL(currentObjectUrl); } catch (_) {}
    }, 15000);
  }
}

async function loadPDF(buffer, title) {
  cleanup();
  isEpub = false;
  currentBookTitle = title;
  currentPDF = await pdfjsLib.getDocument({ data: buffer }).promise;
  currentPage = 1;
  openReader(title);
  await renderPDFPage();
}

async function renderPDFPage() {
  if (!currentPDF) return;
  const page = await currentPDF.getPage(currentPage);
  const content = await page.getTextContent();
  currentText = content.items.map(item => item.str).join(" ").trim();

  const viewport = page.getViewport({ scale: 1.5 });
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

function updateTextFromEpub() {
  setTimeout(() => {
    if (!isEpub) return;
    try {
      const iframe = document.querySelector("#reader iframe");
      const doc = iframe?.contentDocument || iframe?.contentWindow?.document;
      const text = doc?.body?.innerText?.trim();
      if (text) currentText = text;
    } catch (_) {}
  }, 500);
}

function cleanup() {
  if (currentEpub && typeof currentEpub.destroy === "function") {
    try { currentEpub.destroy(); } catch (_) {}
  }
  if (currentObjectUrl) {
    try { URL.revokeObjectURL(currentObjectUrl); } catch (_) {}
  }
  currentPDF = null; currentEpub = null; rendition = null;
  isEpub = false; currentPage = 1; currentText = ""; currentObjectUrl = "";
  els.readerDiv.innerHTML = "";
}

function openReader(title) {
  els.home.classList.add("hidden");
  els.readerScreen.classList.remove("hidden");
  els.title.textContent = title || "Lectura";
  closeModals();
}

function goHome() {
  stopVoice(); stopMusic();
  els.readerScreen.classList.add("hidden");
  els.home.classList.remove("hidden");
  closeModals();
}

async function nextPage() {
  stopVoice();
  if (isEpub && rendition) {
    await rendition.next();
    updateTextFromEpub();
  } else if (currentPDF && currentPage < currentPDF.numPages) {
    currentPage++;
    await renderPDFPage();
  }
}

async function prevPage() {
  stopVoice();
  if (isEpub && rendition) {
    await rendition.prev();
    updateTextFromEpub();
  } else if (currentPDF && currentPage > 1) {
    currentPage--;
    await renderPDFPage();
  }
}

function zoomIn() { currentFont = Math.min(currentFont + 4, 54); epubFontPercent = Math.min(epubFontPercent + 8, 180); applyFontSize(); }
function zoomOut() { currentFont = Math.max(currentFont - 4, 22); epubFontPercent = Math.max(epubFontPercent - 8, 80); applyFontSize(); }
function applyFontSize() {
  if (isEpub && rendition && rendition.themes) {
    try { rendition.themes.fontSize(`${epubFontPercent}%`); } catch (_) {}
  } else {
    els.readerDiv.style.fontSize = `${currentFont}px`;
  }
}

function applyEpubFont() {
  if (rendition && rendition.themes) {
    try { rendition.themes.fontSize(`${epubFontPercent}%`); } catch (_) {}
  }
}

function toggleMusic() {
  const track = MUSIC_TRACKS[Number(els.musicSelect.value) || 0];
  if (!track) return;

  if (!musicAudio || musicAudio.src !== track.url) {
    stopMusic(false);
    musicAudio = new Audio(track.url);
    musicAudio.loop = true;
    musicAudio.volume = 0.22;
  }

  if (musicAudio.paused) {
    musicAudio.play()
      .then(() => els.btnMusica.classList.add("activo"))
      .catch(() => alert("El navegador bloqueó el audio. Toca de nuevo el botón."));
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
  if (!currentText || currentText.length < 10) {
    alert("La página actual no tiene suficiente texto.");
    return;
  }
  stopVoice();
  const utterance = new SpeechSynthesisUtterance(currentText);
  utterance.lang = "es-AR";
  utterance.rate = 0.92;
  speechSynthesis.speak(utterance);
}

function stopVoice() { speechSynthesis.cancel(); }

function summarizeText() {
  if (!currentText || currentText.length < 100) {
    alert("Se necesita más texto en la página para generar una reflexión.");
    return;
  }

  const sentences = window.Intl && Intl.Segmenter
    ? Array.from(new Intl.Segmenter("es", { granularity: "sentence" }).segment(currentText))
        .map(s => s.segment.trim()).filter(Boolean)
    : (currentText.match(/[^.!?]+[.!?]+/g) || [currentText]);

  const first = (sentences[0] || "").trim();
  const middle = (sentences[Math.floor(sentences.length / 2)] || "").trim();
  const last = (sentences[sentences.length - 1] || "").trim();

  els.iaContent.innerHTML = `
    <h4>Premisa</h4>
    <p>${escapeHtml(first)}</p>
    <h4>Tensión</h4>
    <p>${escapeHtml(middle)}</p>
    <h4>Pregunta para pensar</h4>
    <p>Si esta página fuera una conversación con el autor, ¿qué idea oculta te invitaría a explorar más despacio?</p>
    <h4>Eco final</h4>
    <p>${escapeHtml(last)}</p>
  `;
  els.iaModal.classList.remove("hidden");
}

function toggleSettings() { els.settingsModal.classList.toggle("hidden"); }
function closeIaModal() { els.iaModal.classList.add("hidden"); }
function closeModals() { els.settingsModal.classList.add("hidden"); els.iaModal.classList.add("hidden"); }

function escapeHtml(str) {
  return String(str).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function showLoader(msg) {
  els.loaderText.textContent = msg;
  els.loaderSubtext.textContent = "";
  els.loader.classList.remove("hidden");
}

function hideLoader() { els.loader.classList.add("hidden"); }
