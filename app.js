pdfjsLib.GlobalWorkerOptions.workerSrc =
'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let currentText = "";
let currentFontSize = 32;
let currentAudio = null;
let isPlaying = false;
let currentBook = null;
let currentPage = 1;

const RENDER_URL = "https://motor-voz-lector.onrender.com";


// ================================
// CARGAR ARCHIVO
// ================================
document.getElementById("fileInput").addEventListener("change", async function(e){

    const file = e.target.files[0];

    if(!file){
        return;
    }

    if(file.type.includes("pdf")){
        await cargarPDF(file);
    }
    else if(file.name.endsWith(".epub")){
        await cargarEPUB(file);
    }
    else{
        alert("Formato no soportado");
    }

});


// ================================
// CARGAR PDF
// ================================
async function cargarPDF(file){

    document.getElementById("mensaje-estado").innerText =
    "Procesando PDF...";

    const buffer = await file.arrayBuffer();

    currentBook = await pdfjsLib.getDocument({
        data: buffer
    }).promise;

    mostrarPaginaPDF(currentPage);

}


// ================================
// MOSTRAR PAGINA PDF
// ================================
async function mostrarPaginaPDF(pageNumber){

    const page = await currentBook.getPage(pageNumber);

    const content = await page.getTextContent();

    currentText = content.items.map(item => item.str).join(" ");

    document.getElementById("pantalla-carga").classList.remove("activa");
    document.getElementById("pantalla-lectura").classList.add("activa");

    document.getElementById("reader").innerHTML = `
        <div>${currentText}</div>
    `;

    localStorage.setItem("ultimaPagina", pageNumber);
}


// ================================
// CARGAR EPUB
// ================================
async function cargarEPUB(file){

    document.getElementById("mensaje-estado").innerText =
    "Procesando EPUB...";

    const buffer = await file.arrayBuffer();

    const book = ePub(buffer);

    const rendition = book.renderTo("reader", {
        width: "100%",
        height: "100%"
    });

    await rendition.display();

    document.getElementById("pantalla-carga").classList.remove("activa");
    document.getElementById("pantalla-lectura").classList.add("activa");
}


// ================================
// ZOOM
// ================================
function zoomIn(){
    currentFontSize += 4;
    document.getElementById("reader").style.fontSize =
    currentFontSize + "px";
}

function zoomOut(){
    currentFontSize -= 4;
    document.getElementById("reader").style.fontSize =
    currentFontSize + "px";
}


// ================================
// RESALTADO PRINCIPAL
// ================================
function resaltarPrincipal(){

    document.execCommand("hiliteColor", false, "yellow");
}


// ================================
// RESALTADO SECUNDARIO
// ================================
function resaltarSecundario(){

    document.execCommand("hiliteColor", false, "#5DADE2");
}


// ================================
// RESUMEN GRATUITO
// ================================
function resumirTexto(){

    const palabras = currentText.split(" ");

    const resumen = palabras.slice(0,150).join(" ");

    alert("Resumen automático:\n\n" + resumen + "...");
}


// ================================
// VOZ RENDER
// ================================
async function playAudio(){

    if(isPlaying) return;

    isPlaying = true;

    try{

        const response = await fetch(`${RENDER_URL}/tts`,{
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body: JSON.stringify({
                text: currentText
            })
        });

        const blob = await response.blob();

        currentAudio = new Audio(
            URL.createObjectURL(blob)
        );

        currentAudio.play();

        currentAudio.onended = ()=>{
            isPlaying = false;
        };

    }catch(error){

        vozLocal();
    }
}


// ================================
// FALLBACK LOCAL
// ================================
function vozLocal(){

    const speech = new SpeechSynthesisUtterance(currentText);

    speech.lang = "es-AR";
    speech.rate = 0.9;

    speech.onend = ()=>{
        isPlaying = false;
    };

    speechSynthesis.speak(speech);
}


// ================================
// DETENER AUDIO
// ================================
function stopAudio(){

    speechSynthesis.cancel();

    if(currentAudio){
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }

    isPlaying = false;
}


// ================================
// SIGUIENTE PAGINA
// ================================
async function paginaSiguiente(){

    if(currentBook && currentPage < currentBook.numPages){
        currentPage++;
        mostrarPaginaPDF(currentPage);
    }
}


// ================================
// PAGINA ANTERIOR
// ================================
async function paginaAnterior(){

    if(currentBook && currentPage > 1){
        currentPage--;
        mostrarPaginaPDF(currentPage);
    }
}
