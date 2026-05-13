from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.background import BackgroundTask
import edge_tts
import uuid
import os

app = FastAPI()

# Permisos para que la app lea el servidor sin bloqueos
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Endpoint 1: Motor de Voz
@app.post("/tts")
async def generar_audio(data: dict):
    texto = data.get("text", "")
    if not texto:
        return {"error": "No hay texto para leer"}

    # Nombre temporal del archivo
    filename = f"{uuid.uuid4()}.mp3"
    
    # Voz neuronal (Configurada con acento argentino)
    communicate = edge_tts.Communicate(texto, voice="es-AR-TomasNeural")
    await communicate.save(filename)

    # Devuelve el audio y lo borra del servidor para no ocupar espacio
    return FileResponse(filename, media_type="audio/mpeg", background=BackgroundTask(os.remove, filename))

# Endpoint 2: Anti-sueño (Heartbeat)
@app.get("/health")
def servidor_despierto():
    return {"status": "ok", "mensaje": "Motor de voz activo"}
