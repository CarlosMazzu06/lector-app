pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

/* ═══════════════════════════════════════════
   CONFIGURACIÓN DE LA BIBLIOTECA
   Los nombres deben coincidir EXACTAMENTE con los archivos en /book/
   ═══════════════════════════════════════════ */
const BOOKS = [
    {
        title: "Zensorialmente",
        file: "book/Zensorialmente_Estanislao_Bachrach.epub",
        type: "epub",
        icon: "📜"
    },
    {
        title: "Departamento en Venta",
        file: "book/Departamento_en_Venta.pdf",
        type: "pdf",
        icon: "📖"
    }
];

/* ═══════════════════════════════════════════
   MÚSICA CLÁSICA (Archive.org, MP3 estable)
   ═══════════════════════════════════════════ */
const MUSIC_TRACKS = [
    {
        title: "Vivaldi – La Primavera",
        url: "https://archive.org/download/VivaldiFourSeasonsTheSpring/Vivaldi%20-%20The%20Four%20Seasons%2C%20Spring.mp3"
    },
    {
        title: "Beethoven – Claro de Luna",
        url: "https://archive.org/download/MoonlightSonata_755/Beethoven-MoonlightSonata.mp3"
    },
    {
        title: "Chopin – Nocturno Op.9 No.2",
        url: "https://archive.org/download/ChopinNocturneOp9No2_201705/Chopin%20-%20Nocturne%20op.9%20No.2.mp3"
    }
];

/* ──────────── Estado global ──────────── */
let currentPDF = null;
let currentEpub = null;
let rendition = null;
let isEpub = false;
let currentPage = 1;
let currentText = "";
let currentFont = 34;
let musicAudio = new Audio();
musicAudio.volume = 0.22;

/* ──────────── Referencias DOM ──────────── */
const $ = id => document.getElementById(id);
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
    fileInput: $("fileInput")
};

/* ═══════════════════════════════════════════
   INICIALIZACIÓN
   ═══════════════════════════════════════════ */
function init() {
    renderLibrary();
    renderMusicOptions();
    els.fileInput.addEventListener("change", handleLocalFile);
    window.addEventListener("resize", () => {
        if (isEpub && rendition) rendition.resize(window.innerWidth, window.innerHeight);
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
    els.musicSelect.innerHTML = MUSIC_TRACKS.map((t, i) => `<option value="${i}">${t.title}</option>`).join("");
}

/* ═══════════════════════════════════════════
   1. CARGA DESDE EL REPOSITORIO (EPUB por URL)
   ═══════════════════════════════════════════ */
async function loadRepoBook(index) {
    const book = BOOKS[index];
    if (!book) return;
    showLoader(`Abriendo «${book.title}»…`);

    try {
        if (book.type === "epub") {
            // EPUB directamente desde la URL (el motor gestiona la descarga)
            await loadEPUBFromUrl(book.file, book.title);
        } else {
            const response = await fetch(book.file);
            if (!response.ok) throw new Error(`Error ${response.status}`);
            const buffer = await response.arrayBuffer();
            await loadPDF(buffer, book.title);
        }
    } catch (err) {
        alert("❌ No se pudo cargar el libro.\nVerifica que el archivo exista en /book/ y que el nombre escrito en app.js coincida exactamente.");
        console.error(err);
    } finally {
        hideLoader();
    }
}

async function loadEPUBFromUrl(url, title) {
    cleanup();
    isEpub = true;
    openReader(title);

    // Pequeña pausa para asegurar que el contenedor esté visible y con dimensiones
    await new Promise(resolve => setTimeout(resolve, 200));

    currentEpub = ePub(url);
    await currentEpub.ready;

    els.readerDiv.innerHTML = "";

    rendition = currentEpub.renderTo("reader", {
        width: "100%",
        height: window.innerHeight - 80,  // espacio para la barra superior y dock
        spread: "none"
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
    currentText = "Obra cargada. Seleccione texto para usar el narrador o la mente analítica.";
    els.title.textContent = title;
}

/* ═══════════════════════════════════════════
   2. CARGA LOCAL (EPUB desde Blob URL)
   ═══════════════════════════════════════════ */
async function handleLocalFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    showLoader("Analizando pergamino…");

    try {
        const buffer = await file.arrayBuffer();
        const name = file.name.toLowerCase();

        if (name.endsWith(".epub")) {
            await loadEpubFromBuffer(buffer, file.name);
        } else if (name.endsWith(".pdf") || file.type === "application/pdf") {
            await loadPDF(buffer, file.name);
        } else {
            alert("Formato no compatible. Solo PDF o EPUB.");
        }
    } catch (err) {
        alert("El archivo parece dañado o protegido.");
        console.error(err);
    } finally {
        hideLoader();
        els.fileInput.value = ""; // permite volver a seleccionar el mismo archivo
    }
}

async function loadEpubFromBuffer(buffer, title) {
    cleanup();
    isEpub = true;
    openReader(title);

    // Crear un Blob con el tipo MIME correcto
    const blob = new Blob([buffer], { type: "application/epub+zip" });
    const url = URL.createObjectURL(blob);

    currentEpub = ePub(url);
    await currentEpub.ready;

    els.readerDiv.innerHTML = "";

    rendition = currentEpub.renderTo("reader", {
        width: "100%",
        height: window.innerHeight - 80,
        spread: "none"
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
    currentText = "Obra cargada. Seleccione texto para interactuar.";
    els.title.textContent = title;
}

/* ═══════════════════════════════════════════
   3. MOTOR PDF (renderizado por canvas)
   ═══════════════════════════════════════════ */
async function loadPDF(buffer, title = "PDF") {
    cleanup();
    isEpub = false;
    currentPDF = await pdfjsLib.getDocument({ data: buffer }).promise;
    currentPage = 1;
    openReader(title);
    await renderPDFPage();
}

async function renderPDFPage() {
    if (!currentPDF) return;
    const page = await currentPDF.getPage(currentPage);
    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.display = "block";
    canvas.style.margin = "0 auto";
    canvas.style.maxWidth = "100%";
    canvas.style.height = "auto";

    await page.render({
        canvasContext: canvas.getContext("2d"),
        viewport: viewport
    }).promise;

    els.readerDiv.innerHTML = "";
    els.readerDiv.appendChild(canvas);
    els.title.textContent = `Pág. ${currentPage} / ${currentPDF.numPages}`;
    currentText = ""; // Para voz, en PDF no tenemos texto extraído (se podría agregar opcionalmente)
}

/* ═══════════════════════════════════════════
   4. NAVEGACIÓN, ZOOM Y LIMPIEZA
   ═══════════════════════════════════════════ */
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
    } else if (currentPDF && currentPage < currentPDF.numPages) {
        currentPage++;
        await renderPDFPage();
    }
}

async function prevPage() {
    stopVoice();
    if (isEpub && rendition) {
        await rendition.prev();
    } else if (currentPDF && currentPage > 1) {
        currentPage--;
        await renderPDFPage();
    }
}

function zoomIn() {
    currentFont = Math.min(currentFont + 4, 54);
    applyFontSize();
}
function zoomOut() {
    currentFont = Math.max(currentFont - 4, 24);
    applyFontSize();
}
function applyFontSize() {
    // El zoom en PDF (canvas) no aplica, lo dejamos para EPUB
    if (isEpub && rendition && rendition.themes) {
        try { rendition.themes.fontSize(`${currentFont}px`); } catch (_) {}
    } else {
        els.readerDiv.style.fontSize = currentFont + "px";
    }
}

/* ═══════════════════════════════════════════
   5. MÚSICA, VOZ Y RESUMEN
   ═══════════════════════════════════════════ */
function toggleMusicPanel() {
    els.musicPanel.classList.toggle("hidden");
}
function closeMusicPanel() {
    els.musicPanel.classList.add("hidden");
}

async function playSelectedMusic() {
    const index = parseInt(els.musicSelect.value, 10);
    const track = MUSIC_TRACKS[index];
    if (!track) return;

    stopMusic();
    musicAudio = new Audio(track.url);
    musicAudio.loop = true;
    musicAudio.volume = 0.22;

    try {
        await musicAudio.play();
    } catch (error) {
        // El navegador puede bloquear la reproducción automática; un segundo clic lo resuelve
        alert("El gramófono necesita un segundo toque (política del navegador).");
    }
}

function stopMusic() {
    try { musicAudio.pause(); musicAudio.currentTime = 0; } catch (_) {}
}

function playVoice() {
    let text = window.getSelection().toString().trim();
    if (!text) {
        text = isEpub ? els.readerDiv.innerText.trim() : currentText;
    }
    if (!text || text.length < 5) {
        alert("Seleccione un fragmento para leer en voz alta.");
        return;
    }

    stopVoice();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-AR";
    utterance.rate = 0.88;
    speechSynthesis.speak(utterance);
}

function stopVoice() {
    speechSynthesis.cancel();
}

function summarizeText() {
    let text = window.getSelection().toString().trim();
    if (!text) {
        text = isEpub ? els.readerDiv.innerText.trim() : currentText;
    }
    if (!text || text.length < 100) {
        alert("Seleccione un pasaje más extenso para analizar.");
        return;
    }

    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    if (sentences.length <= 3) {
        alert("🧠 Síntesis:\n\n" + text);
        return;
    }

    const first = sentences[0].trim();
    const middle = sentences[Math.floor(sentences.length / 2)].trim();
    const last = sentences[sentences.length - 1].trim();

    alert("🧠 SÍNTESIS LITERARIA:\n\n" + first + "\n\n" + middle + "\n\n" + last);
}

/* ──────────── Utilidades ──────────── */
function showLoader(msg) {
    els.loader.textContent = msg;
    els.loader.classList.remove("hidden");
}
function hideLoader() {
    els.loader.classList.add("hidden");
}
