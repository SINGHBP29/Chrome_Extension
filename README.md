# Orchestrator

`orchestrator/` is now the single runnable app in this workspace. It routes:

- meeting-note questions to ChromaDB retrieval
- employee questions to PostgreSQL
- general chat to Gemini

## Project Structure

```text
orchestrator/
├── config.py
├── graph.py
├── main.py
├── router.py
├── classifier.py
├── data/
│   └── meeting_notes/
├── ingestion/
│   ├── chroma_ingestion.py
│   └── postgres_ingestion.py
├── tools/
│   ├── chat.py
│   ├── chroma_tool.py
│   ├── postgres_tool.py
│   └── unknown.py
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
