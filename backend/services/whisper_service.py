import openai
from config import OPENAI_API_KEY


async def transcribe_audio(file_bytes: bytes, filename: str) -> str:
    """Send audio bytes to OpenAI Whisper API and return transcript text."""
    client = openai.OpenAI(api_key=OPENAI_API_KEY)

    # Whisper expects a file-like object with a name
    import io
    audio_file = io.BytesIO(file_bytes)
    audio_file.name = filename

    transcription = client.audio.transcriptions.create(
        model="whisper-1",
        file=audio_file,
        response_format="text",
    )

    return transcription
