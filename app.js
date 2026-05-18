/* SANTUARIO LITERARIO v5 — Correcciones definitivas
   ============================================================
   EPUB: ePub(arrayBuffer, {openAs:'binary'}) según doc oficial
         http://epubjs.org/documentation/0.3/ → método open()
   Música: pads largos tipo piano grave + armónicos suaves
   Voces: filtro por idioma + selector de todas las disponibles
   Top-nav: 100% transparente, sin barra gris
   ============================================================ */

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
if (location.search) history.replaceState({}, "", location.pathname);

const REPO_OWNER = "CarlosMazzu06", REPO_NAME = "lector-app", BOOK_FOLDER = "book";
const GITHUB_API = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${BOOK_FOLDER}`;

/* MÚSICA — pads cálidos tipo piano grave.
   Cada pieza usa fundamental + dos armónicos suaves a la octava,
   con attack 2s, release 4s. Frecuencias 55-220Hz. */
const MUSIC_TRACKS = [
  { id:"vela", title:"Luz de Vela", subtitle:"Acordes lentos y envolventes", loopMs:32000,
    perform(ctx,dest,start){
      pianoNote(ctx,dest,start,65.41,12,0.14,260);
      pianoNote(ctx,dest,start+4,98.00,10,0.12,320);
      pianoNote(ctx,dest,start+8,82.41,11,0.13,290);
      pianoChord(ctx,dest,start+14,[110.00,146.83,164.81],10,0.08,400);
      pianoNote(ctx,dest,start+24,55.00,8,0.10,220);
    }},
  { id:"abadia", title:"Abadía Silenciosa", subtitle:"Profundidad de cripta", loopMs:34000,
    perform(ctx,dest,start){
      pianoNote(ctx,dest,start,49.00,14,0.12,200);
      pianoNote(ctx,dest,start+6,73.42,11,0.11,260);
      pianoChord(ctx,dest,start+14,[82.41,110.00,130.81],10,0.08,360);
      pianoNote(ctx,dest,start+24,98.00,8,0.10,300);
    }},
  { id:"susurro", title:"Susurro de Pergamino", subtitle:"Drone grave casi inaudible", loopMs:30000,
    perform(ctx,dest,start){
      pianoNote(ctx,dest,start,55.00,13,0.13,240);
      pianoNote(ctx,dest,start+6,82.41,11,0.11,290);
      pianoNote(ctx,dest,start+14,110.00,9,0.10,330);
      pianoChord(ctx,dest,start+22,[130.81,164.81,196.00],8,0.07,400);
    }},
  { id:"refugio", title:"Refugio de Madera", subtitle:"Calidez baja y constante", loopMs:28000,
    perform(ctx,dest,start){
      pianoNote(ctx,dest,start,98.00,10,0.14,300);
      pianoChord(ctx,dest,start+5,[130.81,164.81,196.00],10,0.09,380);
      pianoNote(ctx,dest,start+14,82.41,9,0.11,280);
      pianoNote(ctx,dest,start+22,73.42,8,0.10,260);
    }},
  { id:"brisa", title:"Brisa Nocturna", subtitle:"Aire quieto sin agudos", loopMs:30000,
    perform(ctx,dest,start){
      pianoNote(ctx,dest,start,73.42,11,0.12,260);
      pianoNote(ctx,dest,start+6,110.00,10,0.11,310);
      pianoChord(ctx,dest,start+14,[146.83,196.00,220.00],10,0.07,400);
      pianoNote(ctx,dest,start+24,82.41,7,0.09,280);
    }}
];

const STOPWORDS = new Set(["a","acá","ahí","al","algo","algún","algunas","algunos","ante","antes","aquel","aquella","aquellas","aquellos","aquí","así","aun","aunque","bajo","bien","cada","casi","como","con","contra","cosa","cual","cuales","cualquier","cuando","cuanto","de","del","desde","donde","dos","el","él","ella","ellas","ellos","en","entre","era","eran","es","esa","esas","ese","eso","esos","esta","está","están","estaba","estaban","este","esto","estos","fue","fueron","ha","han","hasta","hay","la","las","le","les","lo","los","más","me","mi","mí","mis","mucho","muy","ni","no","nos","nosotros","o","otro","otra","otros","otras","para","pero","por","porque","pues","que","qué","quien","quién","se","sea","ser","si","sí","sin","sobre","su","sus","también","tan","tanto","te","ti","tiene","tienen","todo","todos","toda","todas","tras","tu","tú","tus","un","una","uno","unos","unas","y","ya","yo","aún","cuándo","dónde","cómo","fuera","hacia"]);

let books=[], currentPDF=null, currentEpub=null, rendition=null, isEpub=false, currentPage=1, currentText="", currentBookTitle="", currentBookId="", pdfZoom=1.0, epubFontPercent=100;
let musicContext=null, musicMasterGain=null, musicPlaying=false, musicLoopHandle=null;
let musicCurrentTrackId=localStorage.getItem("santuario_music_track")||MUSIC_TRACKS[0].id;
let musicVolume=clamp(Number(localStorage.getItem("santuario_music_volume")||"0.85"),0.2,1.4);
let selectedVoiceURI=localStorage.getItem("santuario_voice_uri")||"", voiceRate=clamp(Number(localStorage.getItem("santuario_voice_rate")||"0.95"),0.7,1.4);
let voiceLangFilter=localStorage.getItem("santuario_voice_lang")||"es";
let allVoices=[], currentObjectUrl=null, readStartTime=Date.now(), readingTimerHandle=null, loadToken=0, progressHideTimer=null;
let focusMode=false, currentTheme=localStorage.getItem("santuario_theme")||"pergamino", currentFontProfile=localStorage.getItem("santuario_font")||"garamond";

const $=id=>document.getElementById(id);
const els={
  home:$("homeScreen"), readerScreen:$("readerScreen"), readerDiv:$("reader"), readerContainer:$("readerContainer"),
  title:$("currentTitle"), loader:$("loader"), loaderText:$("loaderText"), loaderSubtext:$("loaderSubtext"),
  bookGrid:$("bookGrid"), fileInput:$("fileInput"), settingsModal:$("settingsModal"),
  iaModal:$("iaModal"), iaContent:$("iaContent"), btnMusica:$("btn-musica"),
  musicBoard:$("musicBoard"), musicNow:$("musicNow"), musicVolume:$("musicVolume"),
  voiceSelect:$("voiceSelect"), voiceLangSelect:$("voiceLangSelect"), voiceRateSelect:$("voiceRateSelect"),
  progressBar:$("progressBar"), progressLabel:$("progressLabel"), readingClock:$("readingClock"),
  bookmarkBtn:$("bookmarkBtn"), bookmarkInfo:$("bookmarkInfo"),
  progressBarWrap:$("progressBarWrap"), continueWrap:$("continueWrap"), continueGrid:$("continueGrid"),
  mainDock:$("mainDock"), topNav:$("topNav"), focusBtn:$("focusBtn"),
  searchBar:$("searchBar"), searchInput:$("searchInput"), searchCount:$("searchCount"),
  fontProfile:$("fontProfile")
};

function clamp(n,min,max){return Math.min(max,Math.max(min,n));}
function wait(ms){return new Promise(r=>setTimeout(r,ms));}
function escapeHtml(s){return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");}
function escapeAttr(s){return escapeHtml(s).replaceAll('"',"&quot;");}
function safeDecodePath(p){try{return decodeURIComponent(p);}catch{return p;}}
function slugify(s){return String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"");}
function formatClock(ms){const s=Math.max(0,Math.floor(ms/1000)),h=Math.floor(s/3600),m=String(Math.floor((s%3600)/60)).padStart(2,"0"),ss=String(s%60).padStart(2,"0");return h>0?`${h}:${m}:${ss}`:`${m}:${ss}`;}

function showLoader(t,s=""){els.loaderText.textContent=t;els.loaderSubtext.textContent=s;els.loader.classList.remove("hidden");}
function hideLoader(){els.loader.classList.add("hidden");}

function openReader(title){
  els.home.classList.replace("activa","oculta");
  els.readerScreen.classList.replace("oculta","activa");
  els.title.textContent=title||"Lectura";
  closeModals();
  readStartTime=Date.now(); startReadingTimer();
  updateProgressUI(0); updateBookmarkButton();
}

function goHome(){
  saveReadingState(); stopVoice(); stopMusic(); cleanup(); stopReadingTimer();
  els.readerScreen.classList.replace("activa","oculta");
  els.home.classList.replace("oculta","activa");
  closeModals(); renderBooks(); renderContinueSection();
}

function cancelarCarga(){
  loadToken++; clearTimeout(progressHideTimer); cleanup(); hideLoader();
  if(els.readerScreen.classList.contains("activa")){
    els.readerScreen.classList.replace("activa","oculta");
    els.home.classList.replace("oculta","activa");
    stopReadingTimer(); renderBooks(); renderContinueSection();
  }
}

function toggleSettings(){els.settingsModal.classList.toggle("hidden");}
function closeIaModal(){els.iaModal.classList.add("hidden");}
function closeModals(){els.settingsModal.classList.add("hidden");els.iaModal.classList.add("hidden");}

function cleanup(){
  if(currentEpub&&typeof currentEpub.destroy==="function"){try{currentEpub.destroy();}catch(_){}}
  if(currentObjectUrl){try{URL.revokeObjectURL(currentObjectUrl);}catch(_){}}
  currentPDF=null; currentEpub=null; rendition=null; isEpub=false; currentPage=1;
  currentText=""; currentBookTitle=""; currentBookId=""; currentObjectUrl=null;
  els.readerDiv.innerHTML=""; els.readerDiv.style.fontSize=""; els.readerDiv.style.fontFamily="";
  pdfZoom=1.0; epubFontPercent=100;
  clearSearch();
}

function updateProgressUI(p){const pp=clamp(Math.round(p),0,100);els.progressBar.value=String(pp);els.progressLabel.textContent=`${pp}%`;}
function startReadingTimer(){stopReadingTimer();readingTimerHandle=setInterval(()=>{els.readingClock.textContent=`⏱ ${formatClock(Date.now()-readStartTime)}`;},1000);els.readingClock.textContent="⏱ 00:00";}
function stopReadingTimer(){clearInterval(readingTimerHandle);readingTimerHandle=null;els.readingClock.textContent="⏱ 00:00";}

function toggleFocus(){
  focusMode=!focusMode;
  els.topNav.classList.toggle("hidden",focusMode);
  els.mainDock.classList.toggle("hidden",focusMode);
  els.progressBarWrap.classList.add("hidden");
  els.focusBtn.classList.toggle("activo",focusMode);
}

function setReaderTheme(theme){
  currentTheme=theme;
  localStorage.setItem("santuario_theme",theme);
  document.body.setAttribute("data-reader-theme",theme);
  document.querySelectorAll(".theme-chip").forEach(c=>c.classList.toggle("activo",c.dataset.theme===theme));
  applyEpubTheme();
}

function changeFontProfile(profile){
  currentFontProfile=profile;
  localStorage.setItem("santuario_font",profile);
  const fam=getFontFamily(profile);
  els.readerDiv.style.fontFamily=fam;
  applyEpubTheme();
}
function getFontFamily(p){
  return {garamond:"'Cormorant Garamond', Georgia, serif",playfair:"'Playfair Display', Georgia, serif",atkinson:"'Atkinson Hyperlegible', Verdana, sans-serif",georgia:"Georgia, serif"}[p]||"'Cormorant Garamond', Georgia, serif";
}

/* BÚSQUEDA EN PÁGINA */
function toggleSearchBar(){
  els.searchBar.classList.toggle("hidden");
  if(!els.searchBar.classList.contains("hidden")) setTimeout(()=>els.searchInput.focus(),50);
  else clearSearch();
}
function executeSearch(){
  const term=(els.searchInput.value||"").trim();
  if(!term){clearSearch();return;}
  const containers=getSearchableContainers();
  let total=0;
  containers.forEach(node=>{
    if(!node) return;
    node.innerHTML=node.innerHTML.replace(/<mark class="search-hit">([^<]*)<\/mark>/g,"$1");
    if(term.length<2) return;
    const escaped=term.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
    const regex=new RegExp(`(${escaped})`,"gi");
    total+=highlightInNode(node,regex);
  });
  els.searchCount.textContent=total>0?`${total} resultado${total===1?"":"s"}`:"sin coincidencias";
}
function getSearchableContainers(){
  const list=[];
  if(isEpub){
    els.readerDiv.querySelectorAll("iframe").forEach(f=>{
      try{const doc=f.contentDocument||f.contentWindow?.document;if(doc?.body) list.push(doc.body);}catch(_){}
    });
  } else { list.push(els.readerDiv); }
  return list;
}
function highlightInNode(node,regex){
  const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT,{acceptNode(n){return n.parentNode.tagName==="MARK"?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT;}});
  const targets=[]; let n;
  while((n=walker.nextNode())) targets.push(n);
  let count=0;
  targets.forEach(textNode=>{
    const text=textNode.nodeValue; if(!regex.test(text)) return;
    regex.lastIndex=0;
    const frag=document.createDocumentFragment();
    let last=0,match;
    while((match=regex.exec(text))!==null){
      if(match.index>last) frag.appendChild(document.createTextNode(text.slice(last,match.index)));
      const mark=document.createElement("mark");mark.className="search-hit";mark.textContent=match[0];
      frag.appendChild(mark); count++; last=match.index+match[0].length;
    }
    if(last<text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    textNode.parentNode.replaceChild(frag,textNode);
  });
  return count;
}
function clearSearch(){
  els.searchInput.value=""; els.searchCount.textContent="";
  getSearchableContainers().forEach(node=>{
    if(!node) return;
    node.innerHTML=node.innerHTML.replace(/<mark class="search-hit">([^<]*)<\/mark>/g,"$1");
  });
}

function toggleProgressBar(){
  els.progressBarWrap.classList.toggle("hidden");
  if(!els.progressBarWrap.classList.contains("hidden")){
    clearTimeout(progressHideTimer);
    progressHideTimer=setTimeout(()=>els.progressBarWrap.classList.add("hidden"),6000);
  }
}
function showProgressTemporarily(){
  els.progressBarWrap.classList.remove("hidden");
  clearTimeout(progressHideTimer);
  progressHideTimer=setTimeout(()=>els.progressBarWrap.classList.add("hidden"),6000);
}

function getBookmark(id){if(!id) return null;try{return JSON.parse(localStorage.getItem(`santuario_bookmark_${id}`)||"null");}catch{return null;}}
function safeCurrentCfi(){try{return rendition?.currentLocation()?.start?.cfi||null;}catch{return null;}}
function toggleBookmark(){
  if(!currentBookId) return;
  const bm=getBookmark(currentBookId);
  if(bm) localStorage.removeItem(`santuario_bookmark_${currentBookId}`);
  else{
    const mark={bookId:currentBookId,title:currentBookTitle,progress:Number(els.progressBar.value||0),page:currentPage,isEpub,cfi:isEpub&&rendition?safeCurrentCfi():null,savedAt:Date.now()};
    localStorage.setItem(`santuario_bookmark_${currentBookId}`,JSON.stringify(mark));
  }
  updateBookmarkButton();
}
function updateBookmarkButton(){
  const bm=currentBookId?getBookmark(currentBookId):null;
  if(!els.bookmarkBtn) return;
  if(bm){
    els.bookmarkBtn.classList.add("activo");
    const when=new Date(bm.savedAt||Date.now()).toLocaleString("es-AR",{dateStyle:"short",timeStyle:"short"});
    els.bookmarkInfo.textContent=`📍 Señalador en ${bm.progress}% · ${when}`;
  } else {
    els.bookmarkBtn.classList.remove("activo");
    els.bookmarkInfo.textContent="Sin señalador";
  }
}
function getAllBookmarks(){
  const list=[];
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(k&&k.startsWith("santuario_bookmark_")){try{const d=JSON.parse(localStorage.getItem(k));if(d&&d.title) list.push(d);}catch{}}
  }
  return list.sort((a,b)=>(b.savedAt||0)-(a.savedAt||0));
}
function renderContinueSection(){
  const bm=getAllBookmarks();
  if(!bm.length){els.continueWrap.classList.add("hidden");return;}
  els.continueWrap.classList.remove("hidden");
  els.continueGrid.innerHTML=bm.slice(0,6).map(b=>{
    const when=new Date(b.savedAt||Date.now()).toLocaleDateString("es-AR",{day:"2-digit",month:"short"});
    return `<button class="continue-card" onclick="continueFromBookmark('${escapeAttr(b.bookId)}')"><span class="continue-title">${escapeHtml(b.title)}</span><span class="continue-meta">📍 ${b.progress}% · ${when}</span></button>`;
  }).join("");
}
function continueFromBookmark(id){
  const idx=books.findIndex(b=>b.id===id);
  if(idx>=0) loadRepoBook(idx);
  else alert("Ese libro ya no está disponible. Cargalo localmente.");
}

function renderMusicBoard(){
  els.musicBoard.innerHTML=MUSIC_TRACKS.map(t=>`<button class="music-card ${t.id===musicCurrentTrackId?"active":""}" onclick="selectMusic('${t.id}')"><span class="music-card-title">${escapeHtml(t.title)}</span><span class="music-card-subtitle">${escapeHtml(t.subtitle)}</span></button>`).join("");
  const sel=MUSIC_TRACKS.find(t=>t.id===musicCurrentTrackId)||MUSIC_TRACKS[0];
  els.musicNow.textContent=sel?(musicPlaying?`♪ Sonando: ${sel.title}`:`Pieza seleccionada: ${sel.title}`):"Tocá una pieza.";
}

/* VOCES — filtro por idioma */
function loadVoices(){
  allVoices=speechSynthesis.getVoices()||[];
  rebuildVoiceList();
}
function rebuildVoiceList(){
  if(!allVoices.length){els.voiceSelect.innerHTML=`<option value="">Voz del sistema</option>`;return;}
  let filtered=allVoices.slice();
  if(voiceLangFilter!=="all"){
    filtered=allVoices.filter(v=>v.lang&&v.lang.toLowerCase().startsWith(voiceLangFilter.toLowerCase()));
    if(!filtered.length) filtered=allVoices.slice();
  }
  filtered.sort((a,b)=>a.lang.localeCompare(b.lang)||a.name.localeCompare(b.name));
  els.voiceSelect.innerHTML=filtered.map(v=>`<option value="${escapeAttr(v.voiceURI)}">${escapeHtml(v.name)} · ${escapeHtml(v.lang)}</option>`).join("");
  const pref=filtered.find(v=>v.voiceURI===selectedVoiceURI)||filtered[0];
  if(pref){els.voiceSelect.value=pref.voiceURI;selectedVoiceURI=pref.voiceURI;localStorage.setItem("santuario_voice_uri",selectedVoiceURI);}
}

async function loadBooksFromGitHub(){
  const res=await fetch(GITHUB_API,{cache:"no-store"});
  if(!res.ok) throw new Error(`HTTP ${res.status}`);
  const files=await res.json();
  books=files.filter(f=>f.type==="file"&&/\.(epub|pdf)$/i.test(f.name)).map(f=>{
    const clean=safeDecodePath(f.name.replace(/\.(epub|pdf)$/i,"").replace(/[_-]+/g," ").trim());
    return {title:clean,file:f.download_url,type:f.name.toLowerCase().endsWith(".epub")?"epub":"pdf",id:slugify(clean)};
  }).sort((a,b)=>a.title.localeCompare(b.title,"es"));
}
function renderBooks(){
  if(!books.length){els.bookGrid.innerHTML=`<p class="grid-msg">📭 No hay libros en /book. Cargá uno desde tu dispositivo.</p>`;return;}
  els.bookGrid.innerHTML=books.map((b,i)=>{
    const bm=getBookmark(b.id),mini=bm?`<div class="book-progress-mini"><span style="width:${bm.progress}%"></span></div>`:"";
    return `<button class="btn-book" onclick="loadRepoBook(${i})" title="${escapeAttr(b.title)}"><span class="book-icon">${b.type==="epub"?"✑":"▣"}</span><div class="book-info"><div class="book-title">${escapeHtml(b.title)}</div><div class="book-meta">${b.type.toUpperCase()}${bm?` · ${bm.progress}%`:""}</div>${mini}</div></button>`;
  }).join("");
}

async function init(){
  document.body.setAttribute("data-reader-theme",currentTheme);
  document.querySelectorAll(".theme-chip").forEach(c=>c.classList.toggle("activo",c.dataset.theme===currentTheme));
  if(els.fontProfile) els.fontProfile.value=currentFontProfile;
  if(els.voiceLangSelect) els.voiceLangSelect.value=voiceLangFilter;
  renderMusicBoard(); loadVoices();
  els.fileInput.addEventListener("change",handleLocalFile);
  els.musicVolume.addEventListener("input",()=>setMusicVolume(Number(els.musicVolume.value)));
  els.voiceSelect.addEventListener("change",()=>{selectedVoiceURI=els.voiceSelect.value;localStorage.setItem("santuario_voice_uri",selectedVoiceURI);});
  els.voiceLangSelect.addEventListener("change",()=>{voiceLangFilter=els.voiceLangSelect.value;localStorage.setItem("santuario_voice_lang",voiceLangFilter);rebuildVoiceList();});
  els.voiceRateSelect.addEventListener("change",()=>{voiceRate=Number(els.voiceRateSelect.value);localStorage.setItem("santuario_voice_rate",String(voiceRate));});
  els.progressBar.addEventListener("input",onProgressSeek);
  els.searchInput.addEventListener("keydown",(e)=>{if(e.key==="Enter") executeSearch();});
  window.addEventListener("resize",()=>{
    if(isEpub&&rendition){try{rendition.resize(getReaderWidth(),getReaderHeight());}catch(_){}fitEpubViews();}
    if(!isEpub&&currentPDF) renderPDFPage().catch(()=>{});
  });
  speechSynthesis.onvoiceschanged=loadVoices; setTimeout(loadVoices,500);
  try{await loadBooksFromGitHub();}catch(err){console.warn("Biblioteca remota no disponible.",err);books=[];}
  renderBooks(); renderContinueSection(); setInitialSelectors();
}
function setInitialSelectors(){els.musicVolume.value=String(musicVolume);els.voiceRateSelect.value=String(voiceRate);renderMusicBoard();}

async function loadRepoBook(index){
  const book=books[index]; if(!book) return;
  const myToken=++loadToken;
  showLoader(`Abriendo ${book.type.toUpperCase()}…`,book.type==="epub"?"Preparando manuscrito…":"Cargando documento…");
  try{
    const response=await fetch(book.file,{cache:"no-store"});
    if(myToken!==loadToken) return;
    if(!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer=await response.arrayBuffer();
    if(myToken!==loadToken) return;
    currentBookId=book.id;
    if(book.type==="epub") await loadEpubFromBuffer(buffer,book.title,myToken);
    else await loadPDF(buffer,book.title,myToken);
    if(myToken!==loadToken) return;
    restoreBookmarkIfAny();
  } catch(err){
    if(myToken!==loadToken) return;
    console.error("loadRepoBook:",err);
    alert(`No se pudo abrir "${book.title}".\n${err.message||err}\nProbá cargarlo localmente.`);
    cancelarCarga();
  } finally { if(myToken===loadToken) hideLoader(); }
}

async function handleLocalFile(e){
  const file=e.target.files?.[0]; if(!file) return;
  const myToken=++loadToken;
  showLoader("Procesando archivo local…",file.name.toLowerCase().endsWith(".epub")?"Preparando EPUB…":"Preparando PDF…");
  try{
    const buffer=await file.arrayBuffer();
    if(myToken!==loadToken) return;
    const name=file.name.toLowerCase(),clean=file.name.replace(/\.(epub|pdf)$/i,"").replace(/[_-]+/g," ").trim();
    currentBookId=slugify(clean);
    if(name.endsWith(".epub")) await loadEpubFromBuffer(buffer,clean,myToken);
    else if(name.endsWith(".pdf")||file.type==="application/pdf") await loadPDF(buffer,clean,myToken);
    else { alert("Formato no compatible. Solo PDF o EPUB."); cancelarCarga(); return; }
    if(myToken!==loadToken) return;
    restoreBookmarkIfAny();
  } catch(err){
    if(myToken!==loadToken) return;
    console.error("handleLocalFile:",err);
    alert(`El archivo parece dañado o protegido.\n${err.message||""}`);
    cancelarCarga();
  } finally { if(myToken===loadToken) hideLoader(); els.fileInput.value=""; }
}

function restoreBookmarkIfAny(){
  const bm=getBookmark(currentBookId); if(!bm) return;
  if(confirm(`Tenés un señalador guardado en "${bm.title}" al ${bm.progress}%. ¿Continuar desde allí?`)){
    if(isEpub&&rendition&&bm.cfi){try{rendition.display(bm.cfi);}catch(_){}}
    else if(!isEpub&&currentPDF&&bm.page){currentPage=clamp(bm.page,1,currentPDF.numPages);renderPDFPage().catch(()=>{});}
    updateProgressUI(bm.progress);
  }
}

/* ============================================================
   EPUB — CORRECCIÓN DEFINITIVA
   Según doc oficial de epub.js: ePub(arrayBuffer, {openAs:'binary'})
   evita TODO el problema de URLs/CORS porque JSZip descomprime
   el binario en memoria.
   ============================================================ */
function getReaderWidth(){return Math.max(320,Math.min(820,els.readerDiv.clientWidth||window.innerWidth-40));}
function getReaderHeight(){return Math.max(420,window.innerHeight-200);}

async function loadEpubFromBuffer(buffer,title,myToken){
  cleanup(); isEpub=true; currentBookTitle=title; openReader(title);
  if(myToken!==loadToken) return;
  await new Promise(r=>requestAnimationFrame(()=>r()));
  await wait(400);
  if(myToken!==loadToken) return;

  // CLAVE: pasar ArrayBuffer + openAs:'binary' (doc oficial epub.js)
  currentEpub=ePub(buffer,{openAs:"binary"});
  await currentEpub.ready;
  if(myToken!==loadToken) return;

  const w=getReaderWidth(), h=getReaderHeight();
  rendition=currentEpub.renderTo("reader",{
    width:w, height:h,
    flow:"scrolled-doc", spread:"none",
    allowScriptedContent:false
  });

  applyEpubTheme();
  rendition.on("rendered",()=>{ refreshVisibleText(); fitEpubViews(); });
  rendition.on("relocated",()=>{ refreshVisibleText(); syncProgressFromEpub(); saveReadingState(); updateBookmarkButton(); fitEpubViews(); });

  const displayPromise=rendition.display();
  const timeout=new Promise((_,reject)=>setTimeout(()=>reject(new Error("EPUB_TIMEOUT (20s)")),20000));
  await Promise.race([displayPromise,timeout]);
  if(myToken!==loadToken) return;

  await wait(200);
  fitEpubViews();
  refreshVisibleText();
  syncProgressFromEpub();
  saveReadingState();
  updateBookmarkButton();
  els.title.textContent=title;
}

function fitEpubViews(){
  if(!rendition) return;
  try{
    els.readerDiv.querySelectorAll("iframe").forEach(iframe=>{
      try{
        const doc=iframe.contentDocument||iframe.contentWindow?.document;
        if(!doc?.body) return;
        const sh=Math.max(doc.body.scrollHeight,doc.documentElement?.scrollHeight||0,420);
        iframe.style.height=sh+"px";
        iframe.style.width="100%";
      }catch(_){}
    });
  }catch(_){}
}

function applyEpubTheme(){
  if(!rendition?.themes) return;
  const themes={pergamino:{bg:"#F4ECD8",fg:"#2C1810"},sepia:{bg:"#EBDDB6",fg:"#3A2A14"},noche:{bg:"#15110D",fg:"#D8C8A8"}};
  const t=themes[currentTheme]||themes.pergamino;
  const fam=getFontFamily(currentFontProfile);
  try{
    rendition.themes.default({
      body:{background:t.bg,color:t.fg,"font-family":fam,"line-height":"1.75",padding:"12px"},
      "p,div":{color:t.fg},
      a:{color:"#8B5A2B"}
    });
    rendition.themes.fontSize(`${epubFontPercent}%`);
  }catch(_){}
}

async function loadPDF(buffer,title,myToken){
  cleanup(); isEpub=false; currentBookTitle=title;
  currentPDF=await pdfjsLib.getDocument({data:buffer}).promise;
  if(myToken!==loadToken) return;
  currentPage=1; openReader(title);
  await renderPDFPage(); saveReadingState(); updateBookmarkButton();
}
async function renderPDFPage(){
  if(!currentPDF) return;
  const page=await currentPDF.getPage(currentPage);
  const content=await page.getTextContent();
  currentText=content.items.map(it=>it.str).join(" ").replace(/\s+/g," ").trim();
  const scale=Math.max(1.0,Math.min(1.6,window.innerWidth/760)),viewport=page.getViewport({scale:scale*pdfZoom});
  const canvas=document.createElement("canvas");
  canvas.width=viewport.width; canvas.height=viewport.height;
  els.readerDiv.innerHTML=""; els.readerDiv.appendChild(canvas);
  await page.render({canvasContext:canvas.getContext("2d"),viewport}).promise;
  updateProgressUI(currentPDF.numPages?(currentPage/currentPDF.numPages)*100:0);
  saveReadingState(); updateBookmarkButton();
}

function refreshVisibleText(){currentText=extractVisibleText();}
function extractVisibleText(){
  if(isEpub&&rendition){
    try{
      const iframes=els.readerDiv.querySelectorAll("iframe"); const parts=[];
      iframes.forEach(f=>{const doc=f.contentDocument||f.contentWindow?.document;const t=doc?.body?.innerText?.trim();if(t) parts.push(t);});
      const merged=parts.join(" ").replace(/\s+/g," ").trim();
      if(merged) return merged;
    }catch(_){}
  }
  return (currentText||"").trim();
}

function syncProgressFromEpub(){
  try{
    const loc=rendition?.currentLocation?.();
    if(!loc?.start) return;
    if(typeof loc.start.percentage==="number"){updateProgressUI(loc.start.percentage*100);return;}
    if(currentEpub?.spine?.spineItems?.length){
      const total=currentEpub.spine.spineItems.length, idx=Math.max(0,loc.start.index||0);
      updateProgressUI(((idx+1)/total)*100);
    }
  }catch(_){}
}

function onProgressSeek(e){
  clearTimeout(progressHideTimer);
  progressHideTimer=setTimeout(()=>els.progressBarWrap.classList.add("hidden"),6000);
  const v=Number(e.target.value);
  if(isEpub){
    const items=currentEpub?.spine?.spineItems||[]; if(!items.length||!rendition) return;
    const ti=Math.min(items.length-1,Math.floor((v/100)*items.length));
    const item=items[ti], cfi=item?.cfiBase?`${item.cfiBase}!`:null;
    if(cfi){try{rendition.display(cfi);}catch(_){}}
  } else if(currentPDF){
    const tp=Math.max(1,Math.min(currentPDF.numPages,Math.round((v/100)*currentPDF.numPages)));
    if(tp!==currentPage){currentPage=tp;renderPDFPage().catch(()=>{});}
  }
  updateProgressUI(v); saveReadingState();
}

function nextPage(){stopVoice();if(isEpub&&rendition) rendition.next().catch(()=>{});else if(currentPDF&&currentPage<currentPDF.numPages){currentPage++;renderPDFPage().catch(()=>{});} saveReadingState();showProgressTemporarily();}
function prevPage(){stopVoice();if(isEpub&&rendition) rendition.prev().catch(()=>{});else if(currentPDF&&currentPage>1){currentPage--;renderPDFPage().catch(()=>{});} saveReadingState();showProgressTemporarily();}
function zoomIn(){if(isEpub){epubFontPercent=clamp(epubFontPercent+10,80,200);applyEpubTheme();setTimeout(fitEpubViews,180);} else{pdfZoom=clamp(pdfZoom+0.1,0.6,2.4);renderPDFPage().catch(()=>{});} saveReadingState();}
function zoomOut(){if(isEpub){epubFontPercent=clamp(epubFontPercent-10,80,200);applyEpubTheme();setTimeout(fitEpubViews,180);} else{pdfZoom=clamp(pdfZoom-0.1,0.6,2.4);renderPDFPage().catch(()=>{});} saveReadingState();}

/* MÚSICA — pads cálidos tipo piano grave */
function getTrackById(id){return MUSIC_TRACKS.find(t=>t.id===id)||MUSIC_TRACKS[0];}

async function ensureMusicContext(){
  if(!musicContext){
    musicContext=new (window.AudioContext||window.webkitAudioContext)();
    const compressor=musicContext.createDynamicsCompressor();
    musicMasterGain=musicContext.createGain();
    compressor.threshold.value=-22; compressor.knee.value=28; compressor.ratio.value=4; compressor.attack.value=0.02; compressor.release.value=0.5;
    musicMasterGain.gain.value=musicVolume;
    musicMasterGain.connect(compressor); compressor.connect(musicContext.destination);
  }
  if(musicContext.state==="suspended") await musicContext.resume();
  if(musicMasterGain) musicMasterGain.gain.setTargetAtTime(musicVolume,musicContext.currentTime,0.05);
}

function setMusicVolume(v){
  musicVolume=clamp(Number(v),0.2,1.4);
  localStorage.setItem("santuario_music_volume",String(musicVolume));
  if(musicMasterGain&&musicContext) musicMasterGain.gain.setTargetAtTime(musicVolume,musicContext.currentTime,0.05);
}

/* Nota tipo piano: fundamental + 1 armónico suave a la octava */
function pianoNote(ctx,dest,start,freq,dur,peak=0.12,cutoff=300){
  // Fundamental
  voice(ctx,dest,start,freq,dur,peak,cutoff,0);
  // Armónico suave (1/3 del volumen, 1 octava arriba)
  voice(ctx,dest,start+0.04,freq*2,dur*0.85,peak*0.35,cutoff*1.8,0);
}
function pianoChord(ctx,dest,start,freqs,dur,peak=0.08,cutoff=350){
  freqs.forEach((f,i)=>pianoNote(ctx,dest,start+i*0.08,f,dur-i*0.4,peak,cutoff));
}
function voice(ctx,dest,start,freq,dur,peak,cutoff,pan=0){
  const osc=ctx.createOscillator(); osc.type="sine"; osc.frequency.setValueAtTime(freq,start);
  const filter=ctx.createBiquadFilter(); filter.type="lowpass";
  filter.frequency.setValueAtTime(cutoff,start); filter.Q.value=0.5;
  const gain=ctx.createGain();
  const attack=2.0, release=4.0;
  gain.gain.setValueAtTime(0.0001,start);
  gain.gain.exponentialRampToValueAtTime(Math.max(peak,0.0002),start+attack);
  gain.gain.setValueAtTime(Math.max(peak,0.0002),start+Math.max(attack,dur*0.6));
  gain.gain.exponentialRampToValueAtTime(0.0001,start+dur+release);
  osc.connect(filter); filter.connect(gain);
  if(ctx.createStereoPanner){const p=ctx.createStereoPanner();p.pan.value=pan;gain.connect(p);p.connect(dest);}
  else gain.connect(dest);
  osc.start(start); osc.stop(start+dur+release+0.2);
}

function stopMusic(updBtn=true){
  musicPlaying=false; clearTimeout(musicLoopHandle); musicLoopHandle=null;
  if(musicContext&&musicMasterGain){try{musicMasterGain.gain.setTargetAtTime(0.0001,musicContext.currentTime,0.1);}catch(_){}}
  if(updBtn){els.btnMusica.classList.remove("activo");els.btnMusica.setAttribute("aria-pressed","false");renderMusicBoard();}
}
function scheduleMusic(track){
  clearTimeout(musicLoopHandle);
  const loop=()=>{if(!musicPlaying||!musicContext||!musicMasterGain) return;const start=musicContext.currentTime+0.1;track.perform(musicContext,musicMasterGain,start);musicLoopHandle=setTimeout(loop,track.loopMs);};
  loop();
}
async function startMusic(trackId){
  await ensureMusicContext();
  const track=getTrackById(trackId); if(!track) return;
  stopMusic(false);
  musicCurrentTrackId=track.id;
  localStorage.setItem("santuario_music_track",musicCurrentTrackId);
  musicPlaying=true;
  els.btnMusica.classList.add("activo"); els.btnMusica.setAttribute("aria-pressed","true");
  if(musicMasterGain&&musicContext) musicMasterGain.gain.setTargetAtTime(musicVolume,musicContext.currentTime,0.12);
  renderMusicBoard(); scheduleMusic(track);
}
async function toggleMusic(){if(musicPlaying) stopMusic();else await startMusic(musicCurrentTrackId||MUSIC_TRACKS[0].id);}
async function selectMusic(id){musicCurrentTrackId=id;localStorage.setItem("santuario_music_track",id);await startMusic(id);}

/* VOZ */
function getVoice(){
  const voices=speechSynthesis.getVoices()||[];
  const sel=voices.find(v=>v.voiceURI===els.voiceSelect.value);
  if(sel) return sel;
  return voices.find(v=>v.lang?.toLowerCase().startsWith(voiceLangFilter.toLowerCase()))||voices[0]||null;
}
async function playVoice(){
  let text=extractVisibleText();
  if(!text||text.length<40){await wait(180);text=extractVisibleText();}
  if(!text||text.length<40){alert("No hay suficiente texto visible para leer.");return;}
  stopVoice();
  const u=new SpeechSynthesisUtterance(text.slice(0,4000));
  const v=getVoice();
  if(v){u.voice=v;u.lang=v.lang||"es-AR";} else u.lang="es-AR";
  u.rate=Number(els.voiceRateSelect.value||voiceRate||0.95); u.pitch=1.0;
  speechSynthesis.speak(u);
}
function stopVoice(){speechSynthesis.cancel();}

/* ANÁLISIS RACIONAL */
function segmentSentences(t){const c=String(t).replace(/\s+/g," ").trim();if(!c) return[];if(window.Intl&&Intl.Segmenter) return Array.from(new Intl.Segmenter("es",{granularity:"sentence"}).segment(c)).map(s=>s.segment.trim()).filter(s=>s&&s.length>25&&s.length<400);return (c.match(/[^.!?]+[.!?]+/g)||[c]).map(s=>s.trim()).filter(s=>s&&s.length>25&&s.length<400);}
function topKeywords(t,lim=8){const w=String(t).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu," ").split(/\s+/).map(x=>x.trim()).filter(x=>x.length>3&&!STOPWORDS.has(x));const f=new Map();for(const x of w) f.set(x,(f.get(x)||0)+1);return [...f.entries()].sort((a,b)=>b[1]-a[1]).slice(0,lim).map(([x])=>x);}
function rankSentences(sent,kw){return sent.map((s,i)=>{const l=s.toLowerCase();let sc=0;for(const k of kw){const safe=k.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");const m=l.match(new RegExp(`\\b${safe}\\b`,"g"));if(m) sc+=m.length*2;}if(s.length>=60&&s.length<=260) sc+=1.5;if(i===0||i===sent.length-1) sc+=0.5;return {sentence:s,score:sc,idx:i};}).sort((a,b)=>b.score-a.score||a.idx-b.idx);}
function shortenSentence(s,max=220){const c=String(s||"").replace(/\s+/g," ").trim();if(!c) return"";if(c.length<=max) return c;return c.slice(0,max-1).trimEnd()+"…";}
function buildInterpretation(main,sec,kw){const focus=kw.slice(0,3).join(", ")||"la voz, el silencio y la mirada";const p=[];p.push(`El fragmento gira en torno a ${focus}.`);if(main) p.push(`La idea central organiza el resto del texto.`);if(sec.length) p.push(`Las ideas secundarias matizan, amplían o tensan esa idea.`);p.push(`Observar lo que el texto omite o repite enriquece la interpretación.`);return p.join(" ");}
function buildQuestion(kw,main){if(kw.length>=2) return `¿Cómo cambia tu lectura si entendés "${kw[0]}" en relación con "${kw[1]}"?`;if(kw.length===1) return `¿Qué se desplaza si "${kw[0]}" es el núcleo silencioso del fragmento?`;if(main) return `¿Qué cambia si este fragmento se lee como escena, tensión o advertencia?`;return `¿Qué sentido se abre con más pausa y menos prisa?`;}

function analyzeText(){
  let text=extractVisibleText();
  if(!text||text.length<120){alert("Se necesita más texto visible. Avanzá la lectura.");return;}
  const sent=segmentSentences(text);
  if(sent.length<2){alert("El fragmento es breve. Avanzá la lectura.");return;}
  const kw=topKeywords(text,8), ranked=rankSentences(sent,kw);
  const main=shortenSentence(ranked[0]?.sentence||sent[0]);
  const sec=ranked.slice(1,4).map(r=>shortenSentence(r.sentence)).filter(s=>s&&s!==main);
  const interp=buildInterpretation(main,sec,kw), quest=buildQuestion(kw,main);
  els.iaContent.innerHTML=`<h4>Idea principal</h4><p>${escapeHtml(main||"No se pudo extraer.")}</p><h4>Ideas secundarias</h4>${sec.length?`<ul>${sec.map(s=>`<li>${escapeHtml(s)}</li>`).join("")}</ul>`:"<p>No se detectaron ideas secundarias claras.</p>"}<h4>Palabras clave</h4><div class="ia-keywords">${kw.length?kw.map(k=>`<span class="ia-keyword">${escapeHtml(k)}</span>`).join(""):"<span class='ia-keyword'>sin claves dominantes</span>"}</div><h4>Interpretación</h4><p>${escapeHtml(interp)}</p><h4>Pregunta para el lector</h4><p>${escapeHtml(quest)}</p>`;
  els.iaModal.classList.remove("hidden");
}

function saveReadingState(){
  if(!currentBookId) return;
  const s={title:currentBookTitle,bookId:currentBookId,isEpub,currentPage,pdfZoom,epubFontPercent,progress:Number(els.progressBar.value||0),savedAt:Date.now()};
  localStorage.setItem(`santuario_state_${currentBookId}`,JSON.stringify(s));
}
function loadSavedState(id){if(!id) return null;try{return JSON.parse(localStorage.getItem(`santuario_state_${id}`)||"null");}catch{return null;}}
function applySavedState(){const s=loadSavedState(currentBookId);if(!s) return;if(typeof s.pdfZoom==="number") pdfZoom=s.pdfZoom;if(typeof s.epubFontPercent==="number") epubFontPercent=s.epubFontPercent;if(typeof s.progress==="number") updateProgressUI(s.progress);if(isEpub) applyEpubTheme();}
window.addEventListener("beforeunload",saveReadingState);

speechSynthesis.onvoiceschanged=loadVoices; setTimeout(loadVoices,500);
init().then(()=>{applySavedState();setInitialSelectors();});
