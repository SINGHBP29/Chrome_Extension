# ChromaDB Meeting Notes Task

## Project Purpose

This module provides a **Phase 1 retrieval system** for HR meeting notes.

The objective is to:

- store meeting notes as text files
- convert notes into chunks
- generate embeddings
- save embeddings in ChromaDB
- retrieve relevant chunks using semantic search

This phase is retrieval-only. No LLM answer generation is used here.

---

## Current Structure

```text
project/
├── chroma_db/
│   ├── data/
│   │   ├── meeting_1.txt
│   │   ├── meeting_2.txt
│   │   ├── meeting_3.txt
│   │   ├── meeting_4.txt
│   │   ├── meeting_5.txt
│   │   ├── meeting_6.txt
│   │   └── meeting_7.txt
│   ├── db/
│   ├── ingestion.py
│   ├── test.py
│   └── chroma_db_task.md
└── postgres_db/
```

---

## Key Files

### `ingestion.py`

Main indexing pipeline:

- reads all `.txt` notes from `chroma_db/data`
- chunks text using `RecursiveCharacterTextSplitter`
- creates embeddings using `sentence-transformers/all-MiniLM-L6-v2`
- writes vectors into persistent Chroma DB at `chroma_db/db`
- rebuilds collection on each run to avoid stale data

### `test.py`

Interactive retrieval tester:

- supports predefined and interactive query modes
- supports meeting-specific filtering (example: `meeting 6`)
- reranks results using semantic + keyword + phrase signals
- removes duplicates and prints concise result previews
- shows relevance percentages and filters weak matches

---

## How To Run

From project root:

```bash
python chroma_db/ingestion.py
python chroma_db/test.py
```

In `test.py`:

- choose `2` for interactive mode
- type query and press Enter
- type `quit` or `exit` to stop

---

## When To Re-Index

Run `ingestion.py` again whenever any file in `chroma_db/data/` is edited, added, or removed.

Typical flow:

1. update notes in `data/`
2. run ingestion
3. run query testing

---

## Suggested Demo Queries

- `what was said about new joiner in meeting 6?`
- `how long is each zumba session?`
- `what was decided about rosetta external promotion?`
- `which chrome extension features are planned first?`
- `what are capstone ownership concerns?`

---

## Implementation Notes

- Persistence path: `chroma_db/db`
- Data path: `chroma_db/data`
- Collection name: `meeting_notes`
- Embedding model: `all-MiniLM-L6-v2`
- Retrieval is optimized for relevance and clarity, not generation

---

## Next Team Steps

- add more meeting files and test against broader query sets
- define evaluation checklist (Relevant@1, Relevant@3)
- expose retrieval via API for frontend integration
- integrate PostgreSQL in next phase for structured HR workflows
