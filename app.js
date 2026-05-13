pdfjsLib.GlobalWorkerOptions.workerSrc =
'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let currentPDF=null;
let currentPage=1;
let currentText="";
let fontSize=28;
let currentAudio=null;
let darkMode=true;

const RENDER_URL="https://motor-voz-lector.onrender.com";

document.getElementById("fileInput").addEventListener("change", async(e)=>{
    const file=e.target.files[0];
    if(!file) return;

    const fileName=file.name.toLowerCase();

    if(fileName.endsWith(".pdf")){
        await loadPDF(file);
    }
    else if(fileName.endsWith(".epub")){
        await loadEPUB(file);
    }
});

async function loadPDF(file){
    const buffer=await file.arrayBuffer();
    currentPDF=await pdfjsLib.getDocument({data:buffer}).promise;
    currentPage=1;
    await renderPDFPage(currentPage);
}

async function renderPDFPage(pageNum){
    const page=await currentPDF.getPage(pageNum);
    const text=await page.getTextContent();

    let formatted="";
    currentText="";

    text.items.forEach(item=>{
        formatted+=`<p>${item.str}</p>`;
        currentText+=item.str+" ";
    });

    showReader(formatted);
}

async function loadEPUB(file){
    const buffer=await file.arrayBuffer();

    document.getElementById("reader").innerHTML="";

    const book=ePub(buffer);

    const rendition=book.renderTo("reader",{
        width:"100%",
        height:"100%",
        flow:"scrolled-doc"
    });

    await rendition.display();

    showReader();
}

function showReader(html=""){
    document.getElementById("uploadScreen").classList.remove("active");
    document.getElementById("readerScreen").classList.add("active");

    if(html){
        document.getElementById("reader").innerHTML=html;
    }
}

function nextPage(){
    if(currentPDF && currentPage<currentPDF.numPages){
        currentPage++;
        renderPDFPage(currentPage);
    }
}

function prevPage(){
    if(currentPDF && currentPage>1){
        currentPage--;
        renderPDFPage(currentPage);
    }
}

function zoomIn(){
    fontSize+=4;
    document.getElementById("reader").style.fontSize=fontSize+"px";
}

function zoomOut(){
    fontSize-=4;
    document.getElementById("reader").style.fontSize=fontSize+"px";
}

function toggleTheme(){
    document.body.classList.toggle("sepia");
}

async function playAudio(){
    try{
        const response=await fetch(`${RENDER_URL}/tts`,{
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                text:currentText
            })
        });

        const blob=await response.blob();

        currentAudio=new Audio(URL.createObjectURL(blob));
        currentAudio.play();

    }catch(err){
        fallbackVoice();
    }
}

function fallbackVoice(){
    const speech=new SpeechSynthesisUtterance(currentText);
    speech.lang="es-AR";
    speech.rate=0.9;
    speechSynthesis.speak(speech);
}

function stopAudio(){
    speechSynthesis.cancel();

    if(currentAudio){
        currentAudio.pause();
        currentAudio.currentTime=0;
    }
}

async function summarizeText(){
    alert("Próxima integración con HuggingFace gratuita.");
}
