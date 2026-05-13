pdfjsLib.GlobalWorkerOptions.workerSrc =
'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let currentPDF=null;
let currentPage=1;
let currentBook=null;
let rendition=null;
let isEpub=false;
let currentFont=28;

const fileInput=document.getElementById("fileInput");

fileInput.addEventListener("change", async(e)=>{
    const file=e.target.files[0];
    if(!file) return;

    document.getElementById("status").innerText="Cargando...";

    const name=file.name.toLowerCase();

    try{
        if(name.endsWith(".pdf")){
            await cargarPDF(file);
        }
        else if(name.endsWith(".epub")){
            await cargarEPUB(file);
        }
        else{
            alert("Formato inválido");
        }
    }catch(err){
        console.error(err);
        alert("Error cargando archivo");
    }
});

async function cargarPDF(file){
    isEpub=false;

    const buffer=await file.arrayBuffer();

    currentPDF=await pdfjsLib.getDocument({
        data:buffer
    }).promise;

    currentPage=1;

    await mostrarPDF();

    abrirLector();
}

async function mostrarPDF(){
    const page=await currentPDF.getPage(currentPage);
    const content=await page.getTextContent();

    let texto="";

    content.items.forEach(item=>{
        texto += item.str + " ";
    });

    document.getElementById("reader").innerHTML=
    `<p>${texto}</p>`;
}

async function cargarEPUB(file){
    isEpub=true;

    const buffer=await file.arrayBuffer();

    document.getElementById("pantalla-carga").classList.remove("activa");
    document.getElementById("pantalla-lectura").classList.add("activa");

    document.getElementById("reader").innerHTML="";

    currentBook=ePub(buffer);

    await currentBook.ready;

    rendition=currentBook.renderTo("reader",{
        width:"100%",
        height:"100%",
        flow:"scrolled-doc"
    });

    await rendition.display();
}

function abrirLector(){
    document.getElementById("pantalla-carga").classList.remove("activa");
    document.getElementById("pantalla-lectura").classList.add("activa");
}

async function paginaSiguiente(){
    if(isEpub && rendition){
        rendition.next();
    }
    else if(currentPDF && currentPage<currentPDF.numPages){
        currentPage++;
        await mostrarPDF();
    }
}

async function paginaAnterior(){
    if(isEpub && rendition){
        rendition.prev();
    }
    else if(currentPDF && currentPage>1){
        currentPage--;
        await mostrarPDF();
    }
}

function zoomIn(){
    currentFont +=4;
    document.getElementById("reader").style.fontSize=currentFont+"px";
}

function zoomOut(){
    currentFont -=4;
    document.getElementById("reader").style.fontSize=currentFont+"px";
}

function playAudio(){
    const text=window.getSelection().toString() ||
    document.getElementById("reader").innerText;

    if(!text) return;

    const speech=new SpeechSynthesisUtterance(text);

    speech.lang="es-AR";
    speech.rate=0.9;

    speechSynthesis.speak(speech);
}

function stopAudio(){
    speechSynthesis.cancel();
}

function resumirTexto(){
    const text=window.getSelection().toString() ||
    document.getElementById("reader").innerText;

    if(text.length<30){
        alert("Seleccione más texto");
        return;
    }

    const resumen=text.split(".").slice(0,3).join(".") + "...";

    alert(resumen);
}
