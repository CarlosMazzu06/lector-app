pdfjsLib.GlobalWorkerOptions.workerSrc =
'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

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

// Música clásica directa, liviana y estable en Wikimedia Commons.
// Si una pista cambiara en el futuro, reemplazás solo la URL de ese objeto.
const MUSIC_TRACKS = [
    {
        title: "Vivaldi — Primavera I",
        url: "https://commons.wikimedia.org/wiki/Special:FilePath/Vivaldi_-_Four_Seasons_1_Spring_mvt_1_Allegro_-_John_Harrison_violin.oga"
    },
    {
        title: "Vivaldi — Primavera II",
        url: "https://commons.wikimedia.org/wiki/Special:FilePath/Vivaldi_-_Four_Seasons_1_Spring_mvt_2_Largo_-_John_Harrison_violin.oga"
    },
    {
        title: "Vivaldi — Otoño I",
        url: "https://commons.wikimedia.org/wiki/Special:FilePath/Vivaldi_-_Four_Seasons_3_Autumn_mvt_1_Allegro_-_John_Harrison_violin.oga"
    }
];

let currentPDF = null;
let currentEpub = null;
let rendition = null;
let isEpub = false;
let currentPage = 1;
let currentText = "";
let currentFont = 34;
let epubFontPercent = 110;

let musicAudio = new Audio();
musicAudio.volume = 0.16;

const els = {
    homeScreen: document.getElementById("homeScreen"),
    readerScreen: document.getElementById("readerScreen"),
    reader: document.getElementById("reader"),
    readerContainer: document.getElementById("readerContainer"),
    currentTitle: document.getElementById("currentTitle"),
    status: document.getElementById("loader"),
    musicPanel: document.getElementById("musicPanel"),
    musicSelect: document.getElementById("musicSelect"),
    fileInput: document.getElementById("fileInput"),
    bookGrid: document.getElementById("bookGrid")
};

renderLibrary();
renderMusicOptions();
wireFileInput();
wireResize();

function renderLibrary() {
    els.bookGrid.innerHTML = BOOKS.map((book, index) => `
        <button class="book-card" onclick="loadRepoBook(${index})">
            <span class="book-icon">${book.icon}</span>
            <div class="book-title">${book.title}</div>
            <div class="book-meta">${book.type.toUpperCase()}</div>
        </button>
    `).join("");
}

function renderMusicOptions() {
    els.musicSelect.innerHTML = MUSIC_TRACKS.map((track, index) => `
        <option value="${index}">${track.title}</option>
    `).join("");
}

function wireFileInput() {
    els.fileInput.addEventListener("change", async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const name = file.name.toLowerCase();
        showLoader("Abriendo obra personal...");

        try {
            const buffer = await file.arrayBuffer();
            if (name.endsWith(".epub")) {
                await loadEPUB(buffer, file.name);
            } else if (name.endsWith(".pdf")) {
                await loadPDF(buffer, file.name);
            } else {
                alert("Formato no soportado. Use PDF o EPUB.");
            }
        } catch (error) {
            console.error(error);
            alert("No se pudo abrir ese archivo.");
        } finally {
            hideLoader();
        }
    });
}

function wireResize() {
    window.addEventListener("resize", () => {
        if (isEpub && rendition) {
            rendition.resize(window.innerWidth, window.innerHeight);
        }
    });
}

// ---------------------
// Repositorio
// ---------------------
async function loadRepoBook(index) {
    const book = BOOKS[index];
    if (!book) return;

    showLoader(`Abriendo ${book.title}...`);

    try {
        const response = await fetch(book.file);
        if (!response.ok) throw new Error("Archivo no encontrado en el repo.");

        const buffer = await response.arrayBuffer();

        if (book.type === "epub") {
            await loadEPUB(buffer, book.title);
        } else {
            await loadPDF(buffer, book.title);
        }
    } catch (error) {
        console.error(error);
        alert(
            "No se pudo abrir el libro.\n\n" +
            "Revisá que el archivo exista en /book y que el nombre coincida exactamente."
        );
    } finally {
        hideLoader();
    }
}

// ---------------------
// PDF
// ---------------------
async function loadPDF(buffer, title = "Lectura PDF") {
    cleanupCurrentBook();

    isEpub = false;
    currentPDF = await pdfjsLib.getDocument({ data: buffer }).promise;
    currentPage = 1;
    currentText = "";

    openReader(title);
    await renderPDFPage();
    applyFontSize();
}

async function renderPDFPage() {
    const page = await currentPDF.getPage(currentPage);
    const content = await page.getTextContent();

    let html = "";
    let text = "";
    let lastY = null;

    for (const item of content.items) {
        const y = item.transform[5];
        if (lastY !== null && Math.abs(lastY - y) > 12) {
            html += "</p><p>";
            text += ". ";
        }
        html += `${escapeHtml(item.str)} `;
        text += `${item.str} `;
        lastY = y;
    }

    currentText = text.trim() || "Página sin texto legible.";
    els.reader.innerHTML = `<p>${html || currentText}</p>`;
    els.readerContainer.scrollTop = 0;
    els.currentTitle.textContent = `${BOOKS.find(b => b.type === 'pdf')?.title || "PDF"} · Página ${currentPage}`;
}

// ---------------------
// EPUB
// ---------------------
async function loadEPUB(buffer, title = "Lectura EPUB") {
    cleanupCurrentBook();

    isEpub = true;
    openReader(title);

    // Darle un frame al navegador para calcular bien el layout antes de renderizar.
    await new Promise(requestAnimationFrame);

    currentEpub = ePub(buffer);
    await currentEpub.ready;

    rendition = currentEpub.renderTo("reader", {
        width: "100%",
        height: "100%",
        flow: "scrolled-doc"
    });

    rendition.on("rendered", () => {
        try {
            rendition.resize(window.innerWidth, window.innerHeight);
            applyEpubFont();
        } catch (_) {}
    });

    await rendition.display();
    applyEpubFont();
    currentText = `Obra EPUB cargada: ${title}.`;
    els.currentTitle.textContent = title;
}

function cleanupCurrentBook() {
    if (currentEpub && typeof currentEpub.destroy === "function") {
        try { currentEpub.destroy(); } catch (_) {}
    }
    currentPDF = null;
    currentEpub = null;
    rendition = null;
    currentPage = 1;
    currentText = "";
    els.reader.innerHTML = "";
}

function openReader(title) {
    els.homeScreen.classList.add("hidden");
    els.readerScreen.classList.remove("hidden");
    els.currentTitle.textContent = title || "Lectura";
    hideMusicPanel();
}

function goHome() {
    stopVoice();
    stopMusic();
    els.readerScreen.classList.add("hidden");
    els.homeScreen.classList.remove("hidden");
    hideMusicPanel();
}

// ---------------------
// Navegación
// ---------------------
async function nextPage() {
    stopVoice();
    if (isEpub && rendition) {
        await rendition.next();
    } else if (currentPDF && currentPage < currentPDF.numPages) {
        currentPage++;
        await renderPDFPage();
        els.currentTitle.textContent = `${els.currentTitle.textContent.split(" · ")[0]} · Página ${currentPage}`;
    }
}

async function prevPage() {
    stopVoice();
    if (isEpub && rendition) {
        await rendition.prev();
    } else if (currentPDF && currentPage > 1) {
        currentPage--;
        await renderPDFPage();
        els.currentTitle.textContent = `${els.currentTitle.textContent.split(" · ")[0]} · Página ${currentPage}`;
    }
}

// ---------------------
// Zoom
// ---------------------
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
    if (isEpub && rendition) {
        applyEpubFont();
    } else {
        els.reader.style.fontSize = `${currentFont}px`;
    }
}

function applyEpubFont() {
    if (rendition && rendition.themes) {
        try {
            rendition.themes.fontSize(`${epubFontPercent}%`);
        } catch (_) {}
    }
}

// ---------------------
// Música
// ---------------------
function toggleMusicPanel() {
    els.musicPanel.classList.toggle("hidden");
}

function hideMusicPanel() {
    els.musicPanel.classList.add("hidden");
}

function playSelectedMusic() {
    const index = Number(els.musicSelect.value);
    const track = MUSIC_TRACKS[index];
    if (!track) return;

    stopMusic();

    musicAudio = new Audio(track.url);
    musicAudio.volume = 0.16;
    musicAudio.loop = true;

    musicAudio.play().catch(() => {
        alert("No se pudo reproducir la pista seleccionada.");
    });
}

function stopMusic() {
    try {
        musicAudio.pause();
        musicAudio.currentTime = 0;
    } catch (_) {}
}

// ---------------------
// Voz
// ---------------------
function playVoice() {
    let text = window.getSelection().toString().trim();

    if (!text) {
        text = isEpub ? document.getElementById("reader").innerText.trim() : currentText;
    }

    if (!text || text.length < 8) {
        alert("Seleccione un fragmento para narrar.");
        return;
    }

    stopVoice();

    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "es-AR";
    speech.rate = 0.88;
    speech.pitch = 1.0;

    window.speechSynthesis.speak(speech);
}

function stopVoice() {
    window.speechSynthesis.cancel();
}

// ---------------------
// Resumen IA local
// ---------------------
function summarizeText() {
    let text = window.getSelection().toString().trim();

    if (!text) {
        text = isEpub ? document.getElementById("reader").innerText.trim() : currentText;
    }

    if (text.length < 120) {
        alert("Seleccione un pasaje más largo para resumir.");
        return;
    }

    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    if (sentences.length <= 3) {
        alert("🧠 Resumen:\n\n" + text);
        return;
    }

    const first = sentences[0].trim();
    const middle = sentences[Math.floor(sentences.length / 2)].trim();
    const last = sentences[sentences.length - 1].trim();

    alert("🧠 SÍNTESIS DE LA OBRA:\n\n" + first + "\n\n" + middle + "\n\n" + last);
}

// ---------------------
// Loader / helpers
// ---------------------
function showLoader(text = "Cargando...") {
    els.loader.textContent = text;
    els.loader.classList.remove("hidden");
}

function hideLoader() {
    els.loader.classList.add("hidden");
}

function escapeHtml(text) {
    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}
