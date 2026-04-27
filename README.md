# Orchestrator

`orchestrator/` is a LangChain ReAct Agent-powered application. It uses a centralized LLM to intelligently invoke tools to answer questions:

- Uses `chroma_tool` for meeting-note questions
- Uses `postgres_tool` for employee questions
- Handles general chat organically

## Project Structure

```text
orchestrator/
├── config.py
├── agent.py
├── main.py
├── data/
│   └── meeting_notes/
├── ingestion/
│   ├── chroma_ingestion.py
│   └── postgres_ingestion.py
├── tools/
│   ├── chroma_tool.py
│   └── postgres_tool.py
└── utils/
    ├── db.py
    ├── meeting_store.py
    └── postgres_queries.py
```

## Setup

```bash
cd /Users/ssingodia/Desktop/Chrome
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create `.env` with:

```env
GOOGLE_API_KEY=your_google_api_key
DB_HOST=localhost
DB_PORT=5432
DB_NAME=orchestrator_db
DB_USER=postgres
DB_PASSWORD=postgres
POSTGRES_DB=orchestrator_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
```

Use `DB_HOST=db` if you run the app inside Docker Compose.

## Data Ingestion

Index the meeting notes into ChromaDB:

```bash
python -m orchestrator.ingestion.chroma_ingestion
```

Seed the employee table in PostgreSQL:

```bash
python -m orchestrator.ingestion.postgres_ingestion
```

## Run

```bash
python -m orchestrator.main
```

## Test

```bash
python3 -m unittest discover -s tests -p "test*.py"
```

## Notes

- Chroma retrieval reads source files from `orchestrator/data/meeting_notes/`
- Chroma persistence is stored in `orchestrator/storage/chroma/`
- PostgreSQL queries are parameterized and generated from employee-related filters in the user question
