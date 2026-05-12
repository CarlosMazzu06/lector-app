let currentText = "";
let currentFontSize = 28;

document.getElementById("fileInput").addEventListener("change", async (e)=>{
    const file = e.target.files[0];

    if(file.size > 100 * 1024 * 1024){
        alert("Archivo demasiado grande");
        return;
    }

    const extension = file.name.split('.').pop();

    if(extension === "pdf"){
        loadPDF(file);
    }

    if(extension === "epub"){
        loadEPUB(file);
    }
});

async function loadPDF(file){
    const reader = new FileReader();

    reader.onload = async function(){
        const typedArray = new Uint8Array(this.result);

        const pdf = await pdfjsLib.getDocument(typedArray).promise;
        const page = await pdf.getPage(1);

        const textContent = await page.getTextContent();

        currentText = textContent.items.map(i=>i.str).join(" ");

        document.getElementById("reader").innerText = currentText;
    };

    reader.readAsArrayBuffer(file);
}

function loadEPUB(file){
    const reader = new FileReader();

    reader.onload = function(){
        const book = ePub(reader.result);

        const rendition = book.renderTo("reader", {
            width:"100%",
            height:"100%"
        });

        rendition.display();
    }

    reader.readAsArrayBuffer(file);
}

function zoomIn(){
 currentFontSize += 2;
 document.getElementById("reader").style.fontSize=currentFontSize+"px";
}

function zoomOut(){
 currentFontSize -= 2;
 document.getElementById("reader").style.fontSize=currentFontSize+"px";
}

async function playAudio(){
    try{
        const response = await Promise.race([
            fetch("https://motor-voz-lector.onrender.com/tts",{
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                body:JSON.stringify({
                    text:currentText
                })
            }),
            new Promise((_,reject)=>
                setTimeout(()=>reject(),2500)
            )
        ]);

        const blob = await response.blob();

        const audio = new Audio(URL.createObjectURL(blob));

        audio.play();

    }catch(error){
        fallbackVoice();
    }
}

function fallbackVoice(){
    let speech = new SpeechSynthesisUtterance(currentText);
    speech.lang="es-ES";
    speechSynthesis.speak(speech);
}

function stopAudio(){
    speechSynthesis.cancel();
}

async function summarizeSelection(){
    let selected = window.getSelection().toString();

    if(!selected){
        alert("Selecciona texto");
        return;
    }

    alert("Aquí conectarás HuggingFace summary API");
}
