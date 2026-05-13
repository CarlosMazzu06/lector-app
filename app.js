pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const BOOKS = [
  {
    title: "Zensorialmente",
    file: "book/Zensorialmente_Estanislao_Bachrach.epub",
    type: "epub",
    icon: "📜"
  }
];

const MUSIC_TRACKS = [
  {
    title: "Vivaldi - La Primavera",
    url: "https://archive.org/download/VivaldiFourSeasonsTheSpring/Vivaldi%20-%20The%20Four%20Seasons%2C%20Spring.mp3"
  },
  {
    title: "Beethoven - Claro de Luna",
    url: "https://archive.org/download/MoonlightSonata_755/Beethoven-MoonlightSonata.mp3"
  },
  {
    title: "Chopin - Nocturno Op.9",
    url: "https://archive.org/download/ChopinNocturneOp9No2_201705/Chopin%20-%20Nocturne%20op.9%20No.2.mp3"
  }
];

let currentPDF = null;
let currentEpub = null;
let rendition = null;
let isEpub = false;
let currentPage = 1;
let currentFont = 32;
let epubFontPercent = 110;
let currentBookTitle = "";
let extractedTextForSpeech = "";
let currentObjectUrl = null;

let musicAudio = new Audio();
musicAudio.volume = 0.22;

const $ = (id) => document.getElementById(id);
const els = {
  home: $("homeScreen"),
  readerScreen: $("readerScreen"),
  readerDiv: $("reader"),
  readerContainer: $("readerContainer"),
  title: $("currentTitle"),
  loader: $("loader"),
  musicPanel: $("musicPanel"),
  musicSelect: $("musicSelect"),
  bookGrid: $("bookGrid"),
  fileInput: $("fileInput"),
  btnGramofono: $("btn-gramofono")
};

function init() {
  renderLibrary();
  renderMusicOptions();
  els.fileInput.addEventListener("change", handleLocalFile);
  window.addEventListener("resize", () => {
    if (isEpub && rendition) {
      try {
        rendition.resize(window.innerWidth, window.innerHeight);
      } catch (_) {}
    }
  });
}
init();

function renderLibrary() {
  els.bookGrid.innerHTML = BOOKS.map((b, i) => `
    <button class="btn-libro-repo" onclick="loadRepoBook(${i})">
      <span class="icono-libro">${b.icon}</span>
      <div class="titulo-libro">${b.title}</div>
      <div class="tipo-libro">${b.type.toUpperCase()}</div>
    </button>
  `).join("");
}

function renderMusicOptions() {
  els.musicSelect.innerHTML = MUSIC_TRACKS.map((t, i) =>
    `<option value="${i}">${t.title}</option>`
  ).join("");
}

async function loadRepoBook(index) {
  const book = BOOKS[index];
  if (!book) return;

  showLoader(`Desempolvando «${book.title}»…`);
  try {
    if (book.type === "epub") {
      await loadEpubFromUrl(book.file, book.title);
    } else {
      const response = await fetch(book.file);
      if (!response.ok) throw new Error(`Error ${response.status}`);
      const buffer = await response.arrayBuffer();
      await loadPDF(buffer, book.title);
    }
  } catch (error) {
    console.error(error);
    alert(`No se pudo abrir "${book.file}". Verificá que exista exactamente en /book/ y que el nombre coincida letra por letra.`);
  } finally {
    hideLoader();
  }
}

async function handleLocalFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  showLoader("Analizando pergamino…");
  try {
    const buffer = await file.arrayBuffer();
    const name = file.name.toLowerCase();

    if (name.endsWith(".epub")) {
      await loadEpubFromBlob(buffer, file.name);
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

async function loadEpubFromUrl(url, title = "EPUB") {
  cleanup();
  isEpub = true;
  currentBookTitle = title;
  openReader(title);

  await new Promise(resolve => setTimeout(resolve, 220));

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
      background: "#F8F1E7",
      color: "#2A1E17",
      "font-family": "EB Garamond, Georgia, serif",
      "line-height": "1.8"
    }
  });

  await rendition.display();
  applyEpubFont();
  updateTextForSpeech();
  currentBookTitle = title;
  els.title.textContent = title;
}

async function loadEpubFromBlob(buffer, title = "EPUB") {
  cleanup();
  isEpub = true;
  currentBookTitle = title;
  openReader(title);

  await new Promise(resolve => setTimeout(resolve, 220));

  const blob = new Blob([buffer], { type: "application/epub+zip" });
  currentObjectUrl = URL.createObjectURL(blob);

  currentEpub = ePub(currentObjectUrl);
  await currentEpub.ready;

  rendition = currentEpub.renderTo("reader", {
    width: "100%",
    height: window.innerHeight - 80,
    spread: "none",
    flow: "scrolled-doc"
  });

  rendition.themes.default({
    body: {
      background: "#F8F1E7",
      color: "#2A1E17",
      "font-family": "EB Garamond, Georgia, serif",
      "line-height": "1.8"
    }
  });

  await rendition.display();
  applyEpubFont();
  updateTextForSpeech();
  currentBookTitle = title;
  els.title.textContent = title;
}

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
  extractedTextForSpeech = content.items.map(item => item.str).join(" ").trim();

  const viewport = page.getViewport({ scale: 1.55 });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = viewport.width;
  canvas.height = viewport.height;
  canvas.style.display = "block";
  canvas.style.margin = "0 auto";
  canvas.style.maxWidth = "100%";
  canvas.style.height = "auto";
  canvas.style.borderRadius = "14px";

  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;

  els.readerDiv.innerHTML = "";
  els.readerDiv.appendChild(canvas);
  els.readerContainer.scrollTop = 0;
  els.title.textContent = `${currentBookTitle} · Pág. ${currentPage}`;
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
  currentPage = 1;
  currentText = "";
  extractedTextForSpeech = "";
  currentObjectUrl = null;
  els.readerDiv.innerHTML = "";
}

function openReader(title) {
  els.home.classList.add("hidden");
  els.readerScreen.classList.remove("hidden");
  els.title.textContent = title || "Lectura";
  closeMusicPanel();
}

function goHome() {
  stopVoice();
  stopMusic();
  els.readerScreen.classList.add("hidden");
  els.home.classList.remove("hidden");
  closeMusicPanel();
}

async function nextPage() {
  stopVoice();
  if (isEpub && rendition) {
    await rendition.next();
    updateTextForSpeech();
  } else if (currentPDF && currentPage < currentPDF.numPages) {
    currentPage++;
    await renderPDFPage();
  }
}

async function prevPage() {
  stopVoice();
  if (isEpub && rendition) {
    await rendition.prev();
    updateTextForSpeech();
  } else if (currentPDF && currentPage > 1) {
    currentPage--;
    await renderPDFPage();
  }
}

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
    try {
      rendition.themes.fontSize(`${epubFontPercent}%`);
    } catch (_) {}
  } else {
    els.readerDiv.style.fontSize = `${currentFont}px`;
  }
}

function applyEpubFont() {
  if (rendition && rendition.themes) {
    try {
      rendition.themes.fontSize(`${epubFontPercent}%`);
    } catch (_) {}
  }
}

function updateTextForSpeech() {
  setTimeout(() => {
    if (isEpub) {
      const iframe = document.querySelector("#reader iframe");
      if (iframe) {
        try {
          const doc = iframe.contentDocument || iframe.contentWindow?.document;
          const text = doc?.body?.innerText?.trim();
          if (text) extractedTextForSpeech = text;
        } catch (_) {}
      }
    } else if (currentPDF && !extractedTextForSpeech) {
      // ya viene cargado desde renderPDFPage()
    }
  }, 450);
}

function getTextoOperativo() {
  let selected = "";

  if (isEpub) {
    const iframe = document.querySelector("#reader iframe");
    if (iframe) {
      try {
        selected = iframe.contentWindow?.getSelection?.().toString().trim() || "";
        if (!selected) {
          const doc = iframe.contentDocument || iframe.contentWindow?.document;
          selected = doc?.body?.innerText?.trim() || "";
        }
      } catch (_) {}
    }
  } else {
    selected = window.getSelection().toString().trim() || "";
  }

  return selected || extractedTextForSpeech || currentText || "";
}

function toggleMusicPanel() {
  els.musicPanel.classList.toggle("hidden");
}

function closeMusicPanel() {
  els.musicPanel.classList.add("hidden");
}

async function playSelectedMusic() {
  const track = MUSIC_TRACKS[Number(els.musicSelect.value)];
  if (!track) return;

  stopMusic();
  musicAudio = new Audio(track.url);
  musicAudio.volume = 0.22;
  musicAudio.loop = true;
  musicAudio.preload = "auto";

  try {
    await musicAudio.play();
    els.btnGramofono.classList.add("activo");
  } catch (error) {
    alert("El navegador bloqueó la reproducción. Presioná 'Reproducir' otra vez.");
  }
}

function stopMusic() {
  try {
    musicAudio.pause();
    musicAudio.currentTime = 0;
    els.btnGramofono.classList.remove("activo");
  } catch (_) {}
}

function playVoice() {
  const text = getTextoOperativo();
  if (!text || text.length < 5) {
    alert("Seleccione un fragmento para leer en voz alta.");
    return;
  }

  stopVoice();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "es-AR";
  utterance.rate = 0.9;
  utterance.pitch = 1.0;
  speechSynthesis.speak(utterance);
}

function stopVoice() {
  speechSynthesis.cancel();
}

function summarizeText() {
  const text = getTextoOperativo();
  if (!text || text.length < 60) {
    alert("Seleccione un pasaje más extenso para analizar.");
    return;
  }

  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  if (sentences.length <= 2) {
    alert("🧠 Síntesis literaria:\n\n" + text);
    return;
  }

  const first = sentences[0].trim();
  const middle = sentences[Math.floor(sentences.length / 2)].trim();
  const last = sentences[sentences.length - 1].trim();

  alert("🧠 SÍNTESIS LITERARIA:\n\n" + first + "\n\n" + middle + "\n\n" + last);
}

function showLoader(msg) {
  els.loader.textContent = msg;
  els.loader.classList.remove("hidden");
}

function hideLoader() {
  els.loader.classList.add("hidden");
}
