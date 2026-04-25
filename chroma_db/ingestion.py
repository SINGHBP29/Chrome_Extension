import os
import chromadb
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer

# =========================
# CONFIG
# =========================
DATA_PATH = "chroma_db/data"
CHROMA_PATH = "chroma_db/db"
COLLECTION_NAME = "meeting_notes"


# =========================
# LOAD DOCUMENTS
# =========================
def load_documents(path):
    docs = []
    for file in os.listdir(path):
        if file.endswith(".txt"):
            with open(os.path.join(path, file), "r") as f:
                docs.append((file, f.read()))
    return docs


# =========================
# CHUNKING (LangChain)
# =========================
def chunk_documents(docs):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=300,
        chunk_overlap=60,
        separators=["\n\n", "\n- ", "\n", ". ", " ", ""],
    )

    all_chunks = []
    metadata = []

    for filename, text in docs:
        chunks = [chunk.strip() for chunk in splitter.split_text(text) if chunk.strip()]

        for i, chunk in enumerate(chunks):
            all_chunks.append(chunk)
            metadata.append({"source": filename, "chunk_id": i})

    return all_chunks, metadata


# =========================
# STORE IN CHROMA (PERSISTENT)
# =========================
def store_in_chroma(chunks, metadata):
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    # Rebuild collection on each ingestion run to avoid stale chunks.
    try:
        client.delete_collection(COLLECTION_NAME)
    except Exception:
        pass
    collection = client.get_or_create_collection(COLLECTION_NAME)

    model = SentenceTransformer("all-MiniLM-L6-v2")
    embeddings = model.encode(chunks)

    for i, chunk in enumerate(chunks):
        source = metadata[i]["source"].replace(".txt", "")
        chunk_id = metadata[i]["chunk_id"]
        collection.add(
            documents=[chunk],
            embeddings=[embeddings[i]],
            metadatas=[metadata[i]],
            ids=[f"{source}_chunk_{chunk_id}"],
        )

    print(f"Stored {len(chunks)} chunks in ChromaDB")


# =========================
# MAIN
# =========================
if __name__ == "__main__":
    print("Loading documents...")
    docs = load_documents(DATA_PATH)

    print("Chunking documents...")
    chunks, metadata = chunk_documents(docs)

    print(f"Total chunks: {len(chunks)}")

    print("Storing in ChromaDB...")
    store_in_chroma(chunks, metadata)

    print("Ingestion complete!")
