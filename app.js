pdfjsLib.GlobalWorkerOptions.workerSrc =
'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let currentPDF=null;
let currentPage=1;
let currentText="";
let currentFont=32;

let radio=new Audio(
"https://stream.live.vc.bbcmedia.co.uk/bbc_radio_three"
);

radio.volume=0.2;

function toggleRadio(){
    if(radio.paused){
        radio.play();
    }else{
        radio.pause();
    }
}

async function cargarDesdeRepo(path,isEpub){

    const response=await fetch(path);
    const buffer=await response.arrayBuffer();

    if(isEpub){
        loadEpub(buffer);
    }else{
        loadPdf(buffer);
    }
}

async function loadPdf(buffer){
    currentPDF=await pdfjsLib.getDocument({data:buffer}).promise;
    currentPage=1;

    renderPdf();

    abrirReader();
}

async function renderPdf(){
    const page=await currentPDF.getPage(currentPage);
    const content=await page.getTextContent();

    let text="";

    content.items.forEach(item=>{
        text += item.str + " ";
    });

    currentText=text;

    document.getElementById("reader").innerHTML=
    `<p>${text}</p>`;
}

async function loadEpub(buffer){
    abrirReader();

    let book=ePub(buffer);

    let rendition=book.renderTo("reader",{
        width:"100%",
        height:"100%",
        flow:"scrolled-doc"
    });

    await rendition.display();
}

function abrirReader(){
    document.getElementById("pantalla-carga").style.display="none";
    document.getElementById("pantalla-lectura").style.display="block";
}

function nextPage(){
    if(currentPDF && currentPage<currentPDF.numPages){
        currentPage++;
        renderPdf();
    }
}

function prevPage(){
    if(currentPDF && currentPage>1){
        currentPage--;
        renderPdf();
    }
}

function zoomIn(){
    currentFont+=4;
    document.getElementById("reader").style.fontSize=currentFont+"px";
}

function zoomOut(){
    currentFont-=4;
    document.getElementById("reader").style.fontSize=currentFont+"px";
}

function playVoice(){
    let speech=new SpeechSynthesisUtterance(currentText);
    speech.lang="es-AR";
    speech.rate=0.9;
    speechSynthesis.speak(speech);
}

function stopVoice(){
    speechSynthesis.cancel();
}

function summarizeText(){
    alert("Resumen IA local próximamente.");
}
