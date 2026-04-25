# ChromaDB Meeting Notes Retrieval

This folder contains a retrieval-only pipeline for HR meeting notes using ChromaDB.

## What It Does

- Loads meeting notes from `data/*.txt`
- Splits notes into chunks
- Generates embeddings with `all-MiniLM-L6-v2`
- Stores vectors in persistent ChromaDB (`chroma_db/db`)
- Lets you query relevant chunks from the terminal

## Prerequisites

- Python 3.9+

## Setup (from project root)

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run

From project root:

```bash
python3 chroma_db/ingestion.py
python3 chroma_db/test.py
```

In `test.py`:

- Choose `2` for interactive mode
- Type a query and press Enter
- Type `exit` or `quit` to stop

## Re-indexing Rule

Re-run `ingestion.py` whenever files in `chroma_db/data/` are added, edited, or deleted.

## Example Queries

- `what was said about new joiner in meeting 6?`
- `how long is each zumba session?`
- `what was decided about rosetta external promotion?`

