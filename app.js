pdfjsLib.GlobalWorkerOptions.workerSrc =
'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let currentText = "";
let currentBook = null;
let currentPage = 1;
let currentFontSize = localStorage.getItem("fontSize") || 34;
let currentAudio = null;
let isPlaying = false;

const RENDER_URL = "https://motor-voz-lector.onrender.com";

document.getElementById("reader").style.fontSize =
currentFontSize + "px";

// ----------------------------
// ANTISLEEP RENDER
// ----------------------------
setInterval(async () => {
    try {
        await fetch(`${RENDER_URL}/health`);
    } catch(e){}
},600000);

// ----------------------------
// CARGAR LIBRO
// ----------------------------
document.getElementById("fileInput").addEventListener("change", async (e)=>{
    const file = e.target.files[0];
    const msj = document.getElementById("mensaje-estado");

    if(!file) return;

    localStorage.setItem("lastBookName", file.name);

    msj.innerText="Cargando libro...";

    try{
        if(file.name.toLowerCase().endsWith(".pdf")){
            await cargarPDF(file);
        }
        else if(file.name.toLowerCase().endsWith(".epub")){
            await cargarEPUB(file);
        }
        else{
            msj.innerText="Solo PDF o EPUB";
        }
    }catch(err){
        msj.innerText="Error al abrir archivo";
        console.log(err);
    }
});

// ----------------------------
// PDF
// ----------------------------
async function cargarPDF(file){
    const buffer = await file.arrayBuffer();

    currentBook = await pdfjsLib.getDocument({
        data: buffer
    }).promise;

    currentPage =
    parseInt(localStorage.getItem("lastPage")) || 1;

    await mostrarPaginaPDF(currentPage);
}

async function mostrarPaginaPDF(pageNumber){

    const page = await currentBook.getPage(pageNumber);

    const content = await page.getTextContent();

    currentText = content.items.map(
        item=>item.str
    ).join(" ");

    if(currentText.trim().length < 20){
        currentText =
        "Este PDF parece escaneado como imagen. Para máxima compatibilidad use PDF con texto seleccionable.";
    }

    document.getElementById("pantalla-carga")
    .classList.remove("activa");

    document.getElementById("pantalla-lectura")
    .classList.add("activa");

    document.getElementById("reader").innerHTML=
    `<div>${currentText}</div>`;

    document.getElementById("reader").scrollTop=0;

    localStorage.setItem("lastPage",pageNumber);
}

// ----------------------------
// EPUB
// ----------------------------
async function cargarEPUB(file){
    const buffer = await file.arrayBuffer();

    const book = ePub(buffer);

    const rendition = book.renderTo("reader",{
        width:"100%",
        height:"100%"
    });

    await rendition.display();

    document.getElementById("pantalla-carga")
    .classList.remove("activa");

    document.getElementById("pantalla-lectura")
    .classList.add("activa");

    currentText =
    "Seleccione texto dentro del EPUB para escuchar.";
}

// ----------------------------
// PAGINAS
// ----------------------------
async function paginaSiguiente(){
    if(currentBook && currentPage < currentBook.numPages){
        currentPage++;
        await mostrarPaginaPDF(currentPage);
    }
}

async function paginaAnterior(){
    if(currentBook && currentPage > 1){
        currentPage--;
        await mostrarPaginaPDF(currentPage);
    }
}

// ----------------------------
// ZOOM
// ----------------------------
function zoomIn(){
    currentFontSize =
    parseInt(currentFontSize)+4;

    document.getElementById("reader")
    .style.fontSize =
    currentFontSize+"px";

    localStorage.setItem(
        "fontSize",
        currentFontSize
    );
}

function zoomOut(){
    currentFontSize =
    parseInt(currentFontSize)-4;

    document.getElementById("reader")
    .style.fontSize =
    currentFontSize+"px";

    localStorage.setItem(
        "fontSize",
        currentFontSize
    );
}

// ----------------------------
// RESALTADO ROBUSTO
// ----------------------------
function highlight(color){
    const selected =
    window.getSelection();

    if(selected.toString().length===0){
        alert("Seleccione texto primero");
        return;
    }

    document.execCommand(
        "backColor",
        false,
        color
    );
}

function resaltarPrincipal(){
    highlight("yellow");
}

function resaltarSecundario(){
    highlight("#6ec6ff");
}

// ----------------------------
// RESUMEN MEJORADO
// ----------------------------
function resumirTexto(){

    const texto =
    window.getSelection().toString()
    || currentText;

    if(texto.length < 80){
        alert("Seleccione más texto");
        return;
    }

    const frases =
    texto.split(/[.!?]/);

    const resumen =
    frases
    .filter(f=>f.length>40)
    .slice(0,5)
    .join(". ");

    alert("Resumen:\n\n"+resumen);
}

// ----------------------------
// AUDIO
// ----------------------------
async function playAudio(){

    const texto =
    window.getSelection().toString()
    || currentText;

    if(!texto || isPlaying) return;

    isPlaying=true;

    try{
        const response =
        await fetch(`${RENDER_URL}/tts`,{
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                text:texto
            })
        });

        const blob =
        await response.blob();

        currentAudio =
        new Audio(
            URL.createObjectURL(blob)
        );

        currentAudio.play();

        currentAudio.onended=()=>{
            isPlaying=false;
        }

    }catch(e){
        vozLocal(texto);
    }
}

// ----------------------------
// FALLBACK LOCAL
// ----------------------------
function vozLocal(texto){

    const speech =
    new SpeechSynthesisUtterance(texto);

    speech.lang="es-AR";
    speech.rate=0.9;

    speech.onend=()=>{
        isPlaying=false;
    }

    speechSynthesis.speak(speech);
}

// ----------------------------
// STOP
// ----------------------------
function stopAudio(){

    isPlaying=false;

    speechSynthesis.cancel();

    if(currentAudio){
        currentAudio.pause();
        currentAudio.currentTime=0;
    }
}
