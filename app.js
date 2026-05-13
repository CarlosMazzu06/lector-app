pdfjsLib.GlobalWorkerOptions.workerSrc =
'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let currentPDF=null;
let currentPage=1;
let currentText="";
let currentFont=32;

let currentEpub=null;
let rendition=null;
let isEpub=false;

document.getElementById("fileInput").addEventListener("change", async function(e){
    const file=e.target.files[0];
    if(!file) return;

    const name=file.name.toLowerCase();

    if(name.endsWith(".pdf")){
        await loadPDF(file);
    }

    else if(name.endsWith(".epub")){
        await loadEPUB(file);
    }
});

async function loadPDF(file){
    isEpub=false;

    const buffer=await file.arrayBuffer();

    currentPDF=await pdfjsLib.getDocument({
        data:buffer
    }).promise;

    currentPage=1;

    await renderPDFPage();

    showReader();
}

async function renderPDFPage(){
    const page=await currentPDF.getPage(currentPage);

    const content=await page.getTextContent();

    let text="";

    content.items.forEach(item=>{
        text+=item.str+" ";
    });

    currentText=text;

    document.getElementById("reader").innerHTML=
        `<p>${text}</p>`;
}

async function loadEPUB(file){
    isEpub=true;

    const buffer=await file.arrayBuffer();

    showReader();

    currentEpub=ePub(buffer);

    rendition=currentEpub.renderTo("reader",{
        width:"100%",
        height:"100%",
        flow:"scrolled-doc"
    });

    await rendition.display();

    currentText="Seleccione texto del EPUB";
}

function showReader(){
    document.getElementById("upload-screen").classList.remove("active");
    document.getElementById("reader-screen").classList.add("active");
}

async function nextPage(){
    stopAudio();

    if(isEpub){
        rendition.next();
    }else{
        if(currentPage<currentPDF.numPages){
            currentPage++;
            await renderPDFPage();
        }
    }
}

async function prevPage(){
    stopAudio();

    if(isEpub){
        rendition.prev();
    }else{
        if(currentPage>1){
            currentPage--;
            await renderPDFPage();
        }
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

function playAudio(){
    let text=window.getSelection().toString();

    if(!text){
        text=currentText;
    }

    const speech=new SpeechSynthesisUtterance(text);
    speech.lang="es-AR";

    speechSynthesis.speak(speech);
}

function stopAudio(){
    speechSynthesis.cancel();
}

function summarizeText(){
    let text=window.getSelection().toString();

    if(!text){
        text=currentText;
    }

    let summary=text.substring(0,500);

    alert("Resumen:\n\n"+summary);
}
