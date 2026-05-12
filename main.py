from fastapi import FastAPI
from fastapi.responses import FileResponse
import edge_tts
import uuid

app = FastAPI()

@app.post("/tts")
async def tts(data:dict):
    text = data["text"]

    filename = f"{uuid.uuid4()}.mp3"

    communicate = edge_tts.Communicate(
        text,
        voice="es-AR-ElenaNeural"
    )

    await communicate.save(filename)

    return FileResponse(
        filename,
        media_type="audio/mpeg"
    )