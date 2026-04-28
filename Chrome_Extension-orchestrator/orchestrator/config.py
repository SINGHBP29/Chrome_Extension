import os
from pathlib import Path

from dotenv import load_dotenv
from langchain_core.rate_limiters import InMemoryRateLimiter

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ORCHESTRATOR_ROOT = PROJECT_ROOT / "orchestrator"
MEETING_DATA_DIR = ORCHESTRATOR_ROOT / "data" / "meeting_notes"
CHROMA_DIR = ORCHESTRATOR_ROOT / "storage" / "chroma"
CHROMA_COLLECTION_NAME = "meeting_notes"

load_dotenv(PROJECT_ROOT / ".env")

_RATE_LIMITER = InMemoryRateLimiter(
    requests_per_second=float(os.getenv("LLM_REQUESTS_PER_SECOND", "0.2")),
    max_bucket_size=1,
)

def get_llm(*, temperature: float = 0.2):
    from langchain_google_genai import ChatGoogleGenerativeAI

    return ChatGoogleGenerativeAI(
        # model="gemini-1.5-flash",
        model="gemini-2.5-pro",
        temperature=temperature,
        api_key=os.getenv("GEMINI_API_KEY"),
        max_retries=int(os.getenv("LLM_MAX_RETRIES", "2")),
        timeout=float(os.getenv("LLM_TIMEOUT", "60")),
        rate_limiter=_RATE_LIMITER,
    )
