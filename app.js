pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let currentText = "";
let currentFontSize = 32;
let isPlaying = false;
let currentAudio = null;

// URL EXACTA DE TU SERVIDOR EN RENDER
const RENDER_TTS_URL = "https://motor-voz-lector.onrender.com/tts";
const RENDER_HEALTH_URL = "https://motor-voz-lector.onrender.com/health";

// 1. SISTEMA ANTI-SUEÑO (Heartbeat cada 10 minutos)
setInterval(async () => {
    try {
        await fetch(RENDER_HEALTH_URL);
        console.log("Manteniendo servidor despierto...");
    } catch (error) {
        console.log("Error en latido de servidor.");
    }
}, 600000);

// 2. CARGA DE LIBROS
document.getElementById("fileInput").addEventListener("change", async function(e) {
    const file = e.target.files[0];
    const statusMsg = document.getElementById("mensaje-estado");

    if (!file) return;
    if (file.size > 150 * 1024 * 1024) {
        statusMsg.innerText = "El archivo es muy pesado. Máximo 150MB.";
        return;
    }

    statusMsg.innerText = "Abriendo libro, por favor espere...";
    const arrayBuffer = await file.arrayBuffer();

    try {
        // Leemos solo la primera página para arrancar rápido
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1); 
        const textContent = await page.getTextContent();
        
        currentText = textContent.items.map(item => item.str).join(' ');
        
        // Cambiar pantalla
        document.getElementById("pantalla-carga").classList.remove("activa");
        document.getElementById("pantalla-lectura").classList.add("activa");
        document.getElementById("reader").innerText = currentText || "Documento escaneado sin texto legible.";
    } catch (err) {
        statusMsg.innerText = "Error al abrir el PDF.";
    }
});

// 3. CONTROLES VISUALES
function zoomIn() { 
    currentFontSize += 4; 
    document.getElementById("reader").style.fontSize = currentFontSize + "px"; 
}

function zoomOut() { 
    currentFontSize -= 4; 
    document.getElementById("reader").style.fontSize = currentFontSize + "px"; 
}

// 4. MOTOR DE VOZ
async function playAudio() {
    if (!currentText || isPlaying) return;
    isPlaying = true;

    try {
        const response = await Promise.race([
            fetch(RENDER_TTS_URL, { 
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: currentText })
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 4000))
        ]);

        if (!response.ok) throw new Error("Fallo en Render");

        const blob = await response.blob();
        currentAudio = new Audio(URL.createObjectURL(blob));
        currentAudio.play();
        currentAudio.onended = () => { isPlaying = false; };

    } catch (error) {
        console.warn("Servidor ocupado. Activando voz nativa de emergencia.");
        vozDeRespaldoLocal();
    }
}

function vozDeRespaldoLocal() {
    const speech = new SpeechSynthesisUtterance(currentText);
    speech.lang = "es-AR"; // Voz argentina
    speech.rate = 0.9;     // Velocidad pausada
    speech.onend = () => { isPlaying = false; };
    speechSynthesis.speak(speech);
}

function stopAudio() {
    isPlaying = false;
    speechSynthesis.cancel();
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }
}

function resumirTexto() {
    alert("Función de resumen IA conectándose pronto...");
}
