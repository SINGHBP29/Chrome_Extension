import os
from pathlib import Path

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ORCHESTRATOR_ROOT = PROJECT_ROOT / "orchestrator"
MEETING_DATA_DIR = ORCHESTRATOR_ROOT / "data" / "meeting_notes"
CHROMA_DIR = ORCHESTRATOR_ROOT / "storage" / "chroma"
CHROMA_COLLECTION_NAME = "meeting_notes"

load_dotenv(PROJECT_ROOT / ".env")

def get_llm():
    from langchain_google_genai import ChatGoogleGenerativeAI

    return ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        temperature=0.2
    )
