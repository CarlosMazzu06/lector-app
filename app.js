pdfjsLib.GlobalWorkerOptions.workerSrc =
'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let currentText=""
let currentFontSize=28
let currentBook=null
let currentPage=1
let speechActive=false
let epubBook=null
let rendition=null

const HF_API="https://api-inference.huggingface.co/models/facebook/bart-large-cnn"

document.getElementById("fileInput").addEventListener("change",loadBook)

async function loadBook(e){
const file=e.target.files[0]

if(!file) return

if(file.name.endsWith(".pdf")){
await loadPDF(file)
}
else if(file.name.endsWith(".epub")){
await loadEPUB(file)
}
}

async function loadPDF(file){
const buffer=await file.arrayBuffer()

currentBook=await pdfjsLib.getDocument({
data:buffer
}).promise

currentPage=1

renderPDFPage()

document.getElementById("uploadScreen").classList.remove("active")
document.getElementById("readerScreen").classList.add("active")
}

async function renderPDFPage(){
const page=await currentBook.getPage(currentPage)
const content=await page.getTextContent()

let text=content.items.map(i=>i.str).join(" ")

currentText=text

document.getElementById("reader").innerHTML=
`<p>${text}</p>`

saveProgress()
}

async function loadEPUB(file){
const buffer=await file.arrayBuffer()

epubBook=ePub(buffer)

rendition=epubBook.renderTo("reader",{
width:"100%",
height:"100%",
flow:"scrolled-doc"
})

await rendition.display()

document.getElementById("uploadScreen").classList.remove("active")
document.getElementById("readerScreen").classList.add("active")
}

document.addEventListener("click",(e)=>{
if(!e.target.closest("#floatingMenu")){
const menu=document.getElementById("floatingMenu")
menu.style.display=
menu.style.display==="flex" ? "none":"flex"
}
})

function increaseFont(){
currentFontSize+=4
document.getElementById("reader").style.fontSize=currentFontSize+"px"
localStorage.setItem("fontSize",currentFontSize)
}

function decreaseFont(){
currentFontSize-=4
document.getElementById("reader").style.fontSize=currentFontSize+"px"
localStorage.setItem("fontSize",currentFontSize)
}

function highlightText(){
const selection=window.getSelection()

if(selection.toString()){
document.execCommand("hiliteColor",false,"yellow")
saveProgress()
}
}

function toggleVoice(){
if(speechActive){
speechSynthesis.cancel()
speechActive=false
return
}

let text=window.getSelection().toString() || currentText

let speech=new SpeechSynthesisUtterance(text)

speech.lang="es-AR"
speech.rate=0.9

speech.onend=()=>{
speechActive=false
}

speechActive=true
speechSynthesis.speak(speech)
}

async function summarizeText(){
let text=window.getSelection().toString() || currentText

if(text.length<200){
alert("Selecciona más texto")
return
}

try{
const response=await fetch(HF_API,{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
inputs:text.substring(0,2000)
})
})

const data=await response.json()

alert(data[0].summary_text)
}
catch{
alert("Servicio ocupado")
}
}

function toggleTheme(){
document.body.classList.toggle("sepia")
}

function saveProgress(){
localStorage.setItem("page",currentPage)
localStorage.setItem("content",document.getElementById("reader").innerHTML)
}
