*{
    margin:0;
    padding:0;
    box-sizing:border-box;
    -webkit-tap-highlight-color:transparent;
}

:root{
    --roble:#3a1914;
    --roble-oscuro:#1e0c07;
    --crema:#fdfbf7;
    --tinta:#2c1408;
    --oro:#d4af37;
    --verde:#3a4a28;
    --vino:#5d2323;
    --violeta:#4a284a;
}

body{
    font-family:'Cormorant Garamond', Georgia, serif;
    overflow:hidden;
    background:
        linear-gradient(rgba(44,20,15,0.75), rgba(44,20,15,0.75)),
        url('https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=2000&auto=format&fit=crop') center/cover fixed;
    color:var(--crema);
}

.overlay{
    position:fixed;
    inset:0;
    background:rgba(44,20,15,0.2);
    backdrop-filter:blur(2px);
    z-index:0;
}

.screen{
    position:relative;
    z-index:1;
    width:100vw;
    height:100vh;
}

.hidden{
    display:none !important;
}

.hero-screen{
    display:flex;
    justify-content:center;
    align-items:center;
    padding:24px;
}

.hero-card{
    width:min(720px, 94vw);
    background:linear-gradient(145deg, var(--roble), var(--roble-oscuro));
    border:2px solid rgba(212,175,55,0.6);
    border-radius:40px;
    box-shadow:0 30px 60px rgba(0,0,0,0.6), inset 0 0 30px rgba(212,175,55,0.08);
    padding:48px 32px;
    text-align:center;
}

.hero-mark{
    font-size:52px;
    color:var(--oro);
    margin-bottom:10px;
    filter:drop-shadow(0 0 10px rgba(212,175,55,0.5));
}

.hero-card h1{
    font-family:'Cinzel', serif;
    font-size:clamp(36px, 6vw, 52px);
    letter-spacing:1.5px;
    color:var(--crema);
}

.hero-card p{
    font-size:clamp(18px, 3vw, 24px);
    color:#f0d79a;
    font-style:italic;
    margin-top:10px;
}

.section-title{
    margin-top:25px;
    margin-bottom:15px;
    font-size:18px;
    letter-spacing:1px;
    color:#f7e1a1;
    text-transform:uppercase;
}

.book-grid{
    display:grid;
    grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));
    gap:14px;
    margin-bottom:20px;
}

.book-card{
    background:rgba(253,251,247,0.08);
    border:1px solid rgba(212,175,55,0.35);
    border-radius:24px;
    padding:20px;
    cursor:pointer;
    text-align:left;
    transition:transform 0.15s, background 0.2s;
    box-shadow:0 8px 20px rgba(0,0,0,0.15);
    min-height:100px;
    color:var(--crema);
}

.book-card:hover{
    background:rgba(212,175,55,0.15);
}

.book-card:active{
    transform:scale(0.98);
}

.book-icon{
    font-size:34px;
    display:block;
    margin-bottom:8px;
}

.book-title{
    font-size:22px;
    font-weight:700;
    line-height:1.2;
}

.book-meta{
    font-size:16px;
    color:#dbb42c;
    margin-top:5px;
}

.upload-btn{
    display:inline-block;
    margin-top:15px;
    background:var(--oro);
    color:var(--tinta);
    padding:18px 32px;
    border-radius:30px;
    font-size:22px;
    font-weight:700;
    cursor:pointer;
    box-shadow:0 12px 24px rgba(0,0,0,0.25);
    transition:transform 0.1s;
}

.upload-btn:active{
    transform:scale(0.96);
}

.loader{
    position:fixed;
    top:20px;
    right:20px;
    z-index:99999;
    background:rgba(0,0,0,0.85);
    color:#fff;
    border:1px solid var(--oro);
    padding:12px 20px;
    border-radius:14px;
    font-size:18px;
    box-shadow:0 10px 24px rgba(0,0,0,0.3);
}

.reader-topbar{
    position:fixed;
    top:0;
    left:0;
    right:0;
    z-index:20;
    display:flex;
    justify-content:space-between;
    align-items:center;
    padding:14px 20px;
    background:linear-gradient(to bottom, rgba(44,20,15,0.96), rgba(44,20,15,0.8), transparent);
}

.current-title{
    font-family:'Cinzel', serif;
    font-size:18px;
    color:#f6e2a2;
    max-width:75vw;
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
}

.home-btn{
    width:48px;
    height:48px;
    border-radius:50%;
    font-size:22px;
    border:1px solid rgba(212,175,55,0.4);
    background:rgba(253,251,247,0.12);
    color:var(--crema);
    cursor:pointer;
}

#readerContainer{
    width:100%;
    height:100vh;
    overflow-y:auto;
    background:var(--crema);
    color:var(--tinta);
    padding-top:80px;
    padding-bottom:200px;
    box-shadow:inset 0 0 60px rgba(58,25,20,0.15);
}

#reader{
    width:min(900px, 92vw);
    margin:0 auto;
    font-size:34px;
    line-height:1.8;
    padding:24px 0;
    text-align:justify;
}

#reader p{
    margin-bottom:26px;
}

.dock{
    position:fixed;
    left:50%;
    transform:translateX(-50%);
    bottom:20px;
    z-index:9999;
    width:min(960px, 96vw);
    background:rgba(58,25,20,0.95);
    border:1px solid rgba(212,175,55,0.5);
    border-radius:35px;
    padding:15px;
    display:flex;
    flex-wrap:wrap;
    gap:10px;
    justify-content:center;
    align-items:center;
    box-shadow:0 18px 40px rgba(0,0,0,0.5);
    padding-bottom:calc(15px + env(safe-area-inset-bottom));
}

.dock button{
    width:62px;
    height:62px;
    border-radius:50%;
    border:1px solid rgba(212,175,55,0.3);
    background:rgba(253,251,247,0.12);
    color:var(--crema);
    font-size:24px;
    cursor:pointer;
    box-shadow:inset 0 0 12px rgba(0,0,0,0.3);
    transition:transform 0.1s;
}

.dock button:active{
    transform:scale(0.92);
}

.music-panel{
    position:fixed;
    left:50%;
    transform:translateX(-50%);
    bottom:120px;
    z-index:9998;
    width:min(500px, 92vw);
    background:rgba(20,10,8,0.98);
    border:1px solid rgba(212,175,55,0.6);
    border-radius:24px;
    padding:20px;
    box-shadow:0 20px 50px rgba(0,0,0,0.5);
}

.panel-title{
    font-family:'Cinzel', serif;
    font-size:22px;
    color:var(--oro);
    text-align:center;
    margin-bottom:15px;
}

.music-select{
    width:100%;
    font-size:18px;
    padding:14px;
    border-radius:16px;
    border:1px solid rgba(212,175,55,0.4);
    background:rgba(253,251,247,0.1);
    color:var(--crema);
    outline:none;
}

.panel-actions{
    margin-top:15px;
    display:flex;
    flex-wrap:wrap;
    gap:10px;
    justify-content:center;
}

.panel-btn{
    border:none;
    border-radius:20px;
    padding:12px 20px;
    font-size:18px;
    font-weight:bold;
    cursor:pointer;
    color:var(--crema);
}

.btn-play{ background:var(--verde); }
.btn-stop{ background:var(--vino); }
.btn-close{ background:var(--violeta); }

.dock button[title="Música"]{ background:#8b5cf6; }
.dock button[title="Voz"]{ background:var(--verde); }
.dock button[title="Silenciar voz"]{ background:var(--vino); }
.dock button[title="Resumen inteligente"]{ background:var(--violeta); font-size:30px; }

@media (max-width: 600px){
    .tarjeta-roble{
        padding:32px 16px;
        border-radius:32px;
    }

    .book-grid{
        grid-template-columns:1fr;
    }

    #reader{
        font-size:28px;
        width:94vw;
    }

    .dock{
        width:98vw;
        gap:8px;
        border-radius:28px;
        padding:10px;
    }

    .dock button{
        width:54px;
        height:54px;
        font-size:21px;
    }

    .music-panel{
        bottom:105px;
    }
}
