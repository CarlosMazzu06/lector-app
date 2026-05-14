pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// ── BIBLIOTECA (solo libros reales) ──
const BOOKS = [
  {
    title: "Zensorialmente",
    file: "book/Zensorialmente_Estanislao_Bachrach.epub",
    type: "epub"
  }
];

// ── MÚSICA AMBIENTAL (archivo público, estable) ──
const AMBIENT_MUSIC_URL = "https://upload.wikimedia.org/wikipedia/commons/d/d4/Beethoven_Piano_Sonata_No._14_in_C-sharp_minor%2C_%22Moonlight%22%2C_Op._27_No._2_-_I._Adagio_sostenuto.ogg";

// ── ESTADO GLOBAL ──
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

// ── REFERENCIAS DOM ──
const $ = (id) => document.getElementById(id);
const els = {
  home: $("homeScreen"),
  readerScreen: $("readerScreen"),
  readerDiv: $("reader"),
  readerContainer: $("readerContainer"),
  title: $("currentTitle"),
  loader: $("loader"),
  loaderSubtext: $("loaderSubtext"),
  bookGrid: $("bookGrid"),
  fileInput: $("fileInput"),
  settingsModal: $("settingsModal"),
  iaModal: $("iaModal"),
  iaContent: $("iaContent"),
  btnMusica: $("btn-musica")
};

// ── INICIALIZACIÓN ──
function init() {
  renderLibrary();
  els.fileInput.addEventListener("change", handleLocalFile);
  window.addEventListener("resize", () => {
    if (isEpub && rendition) rendition.resize(window.innerWidth, window.innerHeight);
  });
}
init();

function renderLibrary() {
  els.bookGrid.innerHTML = BOOKS.map((b, i) => `
    <button class="btn-libro-repo" onclick="loadRepoBook(${i})">
      <div class="info-libro">
        <div class="tipo-libro">${b.type}</div>
        <div class="titulo-libro">${b.title}</div>
      </div>
    </button>
  `).join("");
}

// ── CARGA DESDE REPOSITORIO ──
async function loadRepoBook(index) {
  const book = BOOKS[index];
  if (!book) return;

  showLoader("Desencriptando archivo...");
  if (book.type === "epub") els.loaderSubtext.textContent = "Descomprimiendo EPUB. Tiempo estimado: 10-25 segundos...";

  try {
    if (book.type === "epub") {
      await loadEpubFromUrl(book.file, book.title);
    } else {
      const response = await fetch(book.file);
      if (!response.ok) throw new Error(`Error ${response.status}`);
      const buffer = await response.arrayBuffer();
      await loadPDF(buffer, book.title);
    }
  } catch (err) {
    console.error(err);
    alert(`No se pudo abrir "${book.file}". Verifica que el archivo exista en /book/ y el nombre coincida exactamente.`);
  } finally {
    hideLoader();
  }
}

// ── CARGA LOCAL ──
async function handleLocalFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  showLoader("Procesando archivo...");

  try {
    const buffer = await file.arrayBuffer();
    const name = file.name.toLowerCase();

    if (name.endsWith(".epub")) {
      els.loaderSubtext.textContent = "Descomprimiendo EPUB local...";
      const blob = new Blob([buffer], { type: "application/epub+zip" });
      await loadEpubFromUrl(URL.createObjectURL(blob), file.name);
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

// ── EPUB ──
async function loadEpubFromUrl(url, title = "EPUB") {
  cleanup();
  isEpub = true;
  currentBookTitle = title;
  openReader(title);

  // Pausa para garantizar que el contenedor sea visible
  await new Promise(resolve => setTimeout(resolve, 200));

  currentEpub = ePub(url);
  await currentEpub.ready;

  rendition = currentEpub.renderTo("reader", {
    width: "100%",
    height: window.innerHeight - 80,
    spread: "none",
    flow: "scrolled-doc"
  });

  rendition.themes.default({
    body: {
      background: "#0F0F11",
      color: "#E5E7EB",
      "font-family": "Playfair Display, serif",
      "line-height": "1.9"
    }
  });

  rendition.on("rendered", updateEpubText);
  rendition.on("relocated", updateEpubText);

  await rendition.display();
  applyEpubFont();
  updateEpubText();
  els.title.textContent = title;
}

function updateEpubText() {
  setTimeout(() => {
    if (!isEpub) return;
    const iframe = document.querySelector("#reader iframe");
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      const text = doc?.body?.innerText?.trim();
      if (text) currentText = text;
    } catch (_) {}
  }, 500);
}

// ── PDF ──
async function loadPDF(buffer, title = "PDF") {
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

// ── LIMPIEZA ──
function cleanup() {
  if (currentEpub && typeof currentEpub.destroy === "function") {
    try { currentEpub.destroy(); } catch (_) {}
  }
  currentPDF = null;
  currentEpub = null;
  rendition = null;
  currentPage = 1;
  currentText = "";
  els.readerDiv.innerHTML = "";
}

// ── CAMBIO DE PANTALLAS ──
function openReader(title) {
  els.home.classList.add("hidden");
  els.readerScreen.classList.remove("hidden");
  els.title.textContent = title || "Lectura";
  closeModals();
}

function goHome() {
  stopVoice();
  stopMusic();
  els.readerScreen.classList.add("hidden");
  els.home.classList.remove("hidden");
  closeModals();
}

// ── NAVEGACIÓN ──
async function nextPage() {
  stopVoice();
  if (isEpub && rendition) {
    await rendition.next();
    updateEpubText();
  } else if (currentPDF && currentPage < currentPDF.numPages) {
    currentPage++;
    await renderPDFPage();
  }
}

async function prevPage() {
  stopVoice();
  if (isEpub && rendition) {
    await rendition.prev();
    updateEpubText();
  } else if (currentPDF && currentPage > 1) {
    currentPage--;
    await renderPDFPage();
  }
}

// ── ZOOM ──
function zoomIn() {
  currentFont = Math.min(currentFont + 4, 54);
  epubFontPercent = Math.min(epubFontPercent + 8, 180);
  applyFontSize();
}
function zoomOut() {
  currentFont = Math.max(currentFont - 4, 24);
  epubFontPercent = Math.max(epubFontPercent - 8, 80);
  applyFontSize();
}
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

// ── MÚSICA ──
function toggleMusic() {
  if (!musicAudio) {
    musicAudio = new Audio(AMBIENT_MUSIC_URL);
    musicAudio.loop = true;
    musicAudio.volume = 0.3;
  }
  if (musicAudio.paused) {
    musicAudio.play()
      .then(() => els.btnMusica.classList.add("activo"))
      .catch(() => alert("El navegador bloqueó la música. Vuelve a presionar el botón."));
  } else {
    musicAudio.pause();
    els.btnMusica.classList.remove("activo");
  }
}
function stopMusic() {
  if (musicAudio) {
    musicAudio.pause();
    musicAudio.currentTime = 0;
    els.btnMusica.classList.remove("activo");
  }
}

// ── VOZ ──
function playVoice() {
  if (!currentText || currentText.length < 10) {
    alert("La página actual no tiene suficiente texto para leer.");
    return;
  }
  stopVoice();
  const utterance = new SpeechSynthesisUtterance(currentText);
  utterance.lang = "es-AR";
  utterance.rate = 0.9;
  speechSynthesis.speak(utterance);
}
function stopVoice() { speechSynthesis.cancel(); }

// ── REFLEXIÓN ANALÍTICA ──
function summarizeText() {
  if (!currentText || currentText.length < 100) {
    alert("Se necesita más texto en la página para generar una reflexión.");
    return;
  }

  let sentences = [];
  // API moderna de segmentación lingüística
  if (window.Intl && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter('es', { granularity: 'sentence' });
    sentences = Array.from(segmenter.segment(currentText)).map(s => s.segment);
  } else {
    sentences = currentText.match(/[^.!?]+[.!?]+/g) || [currentText];
  }

  if (sentences.length <= 2) {
    els.iaContent.innerHTML = `<strong>Nota del analista:</strong> El pasaje es demasiado breve. Continúa la lectura para obtener una reflexión más profunda.`;
  } else {
    const tesis = sentences[0].trim();
    const nudo = sentences[Math.floor(sentences.length / 2)].trim();
    const conclusion = sentences[sentences.length - 1].trim();

    els.iaContent.innerHTML = `
      <strong>1. La premisa central:</strong><br>${tesis}<br><br>
      <strong>2. Punto de inflexión:</strong><br>${nudo}<br><br>
      <strong>3. Desenlace y reflexión:</strong><br>${conclusion}
    `;
  }
  els.iaModal.classList.remove("hidden");
}
function closeIaModal() { els.iaModal.classList.add("hidden"); }

// ── MODALES ──
function toggleSettings() { els.settingsModal.classList.toggle("hidden"); }
function closeModals() {
  els.settingsModal.classList.add("hidden");
  els.iaModal.classList.add("hidden");
}

// ── LOADER ──
function showLoader(msg) {
  els.loaderText.textContent = msg;
  els.loaderSubtext.textContent = "";
  els.loader.classList.remove("hidden");
}
function hideLoader() {
  els.loader.classList.add("hidden");
}
