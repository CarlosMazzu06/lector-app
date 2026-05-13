pdfjsLib.GlobalWorkerOptions.workerSrc =
'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let currentPDF=null;
let currentPage=1;
let currentText="";
let currentFont=34;

let currentEpub=null;
let rendition=null;
let isEpub=false;

let musicTracks=[
"music/clasica1.mp3",
"music/clasica2.mp3",
"music/clasica3.mp3"
];

let currentTrack=0;
let audio=new Audio(musicTracks[currentTrack]);
audio.volume=0.3;
audio.loop=false;

audio.onended=()=>{
currentTrack=(currentTrack+1)%musicTracks.length;
audio=new Audio(musicTracks[currentTrack]);
audio.volume=0.3;
audio.play();
};

async function loadRepoBook(path,isEPUB){
    const response=await fetch(path);
    const buffer=await response.arrayBuffer();

    if(isEPUB){
        await loadEPUB(buffer);
    }else{
        await loadPDF(buffer);
    }
}

document.getElementById("fileInput").addEventListener("change", async(e)=>{
    const file=e.target.files[0];
    if(!file)return;

    const buffer=await file.arrayBuffer();

    if(file.name.endsWith(".epub")){
        await loadEPUB(buffer);
    }else{
        await loadPDF(buffer);
    }
});

async function loadPDF(buffer){
    isEpub=false;

    currentPDF=await pdfjsLib.getDocument({
        data:buffer
    }).promise;

    currentPage=1;

    await renderPDF();

    showReader();
}

async function renderPDF(){
    const page=await currentPDF.getPage(currentPage);
    const content=await page.getTextContent();

    let text="";

    content.items.forEach(i=>{
        text+=i.str+" ";
    });

    currentText=text;

    document.getElementById("reader").innerHTML=
    `<p>${text}</p>`;
}

async function loadEPUB(buffer){
    isEpub=true;

    showReader();

    document.getElementById("reader").innerHTML="";

    currentEpub=ePub(buffer);

    rendition=currentEpub.renderTo("reader",{
        width:"100%",
        height:"100%",
        flow:"scrolled-doc"
    });

    await rendition.display();
}

function showReader(){
document.getElementById("homeScreen").classList.remove("active");
document.getElementById("readerScreen").classList.add("active");
}

async function nextPage(){
if(isEpub){
await rendition.next();
}else{
if(currentPage<currentPDF.numPages){
currentPage++;
await renderPDF();
}
}
}

async function prevPage(){
if(isEpub){
await rendition.prev();
}else{
if(currentPage>1){
currentPage--;
await renderPDF();
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

function toggleMusic(){
if(audio.paused){
audio.play();
}else{
audio.pause();
}
}

function playVoice(){
let text=window.getSelection().toString() || currentText;

if(!text)return;

let speech=new SpeechSynthesisUtterance(text);
speech.lang="es-AR";
speech.rate=0.9;

window.speechSynthesis.speak(speech);
}

function stopVoice(){
window.speechSynthesis.cancel();
}

function summarize(){
let text=window.getSelection().toString() || currentText;

if(text.length<100){
alert("Seleccione más texto");
return;
}

let sentences=text.match(/[^.!?]+[.!?]+/g)||[text];

let summary=sentences.slice(0,3).join(" ");

alert("Resumen IA:\n\n"+summary);
}
