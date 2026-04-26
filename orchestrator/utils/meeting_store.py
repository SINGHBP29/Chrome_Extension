from pathlib import Path

from orchestrator.config import CHROMA_COLLECTION_NAME, CHROMA_DIR, MEETING_DATA_DIR


def load_meeting_documents(data_dir=None):
    source_dir = Path(data_dir or MEETING_DATA_DIR)
    documents = []

    for path in sorted(source_dir.glob("*.txt")):
        documents.append((path.name, path.read_text(encoding="utf-8")))

    return documents


def chunk_meeting_documents(documents):
    from langchain_text_splitters import RecursiveCharacterTextSplitter

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=300,
        chunk_overlap=60,
        separators=["\n\n", "\n- ", "\n", ". ", " ", ""],
    )

    chunks = []
    metadata = []

    for filename, text in documents:
        split_chunks = [chunk.strip() for chunk in splitter.split_text(text) if chunk.strip()]
        for chunk_id, chunk in enumerate(split_chunks):
            chunks.append(chunk)
            metadata.append({"source": filename, "chunk_id": chunk_id})

    return chunks, metadata


def rebuild_meeting_collection(data_dir=None, persist_dir=None, collection_name=CHROMA_COLLECTION_NAME):
    import chromadb
    from sentence_transformers import SentenceTransformer

    documents = load_meeting_documents(data_dir=data_dir)
    chunks, metadata = chunk_meeting_documents(documents)
    storage_dir = Path(persist_dir or CHROMA_DIR)
    storage_dir.mkdir(parents=True, exist_ok=True)

    client = chromadb.PersistentClient(path=str(storage_dir))
    try:
        client.delete_collection(collection_name)
    except Exception:
        pass

    collection = client.get_or_create_collection(collection_name)

    if not chunks:
        return 0

    embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    embeddings = embedding_model.encode(chunks).tolist()

    for index, chunk in enumerate(chunks):
        source = metadata[index]["source"].replace(".txt", "")
        chunk_id = metadata[index]["chunk_id"]
        collection.add(
            documents=[chunk],
            embeddings=[embeddings[index]],
            metadatas=[metadata[index]],
            ids=[f"{source}_chunk_{chunk_id}"],
        )

    return len(chunks)


def retrieve_meeting_chunks(query, limit=4, persist_dir=None, collection_name=CHROMA_COLLECTION_NAME):
    import chromadb
    from sentence_transformers import SentenceTransformer

    storage_dir = Path(persist_dir or CHROMA_DIR)
    if not storage_dir.exists():
        return []

    client = chromadb.PersistentClient(path=str(storage_dir))
    try:
        collection = client.get_collection(collection_name)
    except Exception:
        return []

    embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    query_embedding = embedding_model.encode([query]).tolist()[0]
    result = collection.query(query_embeddings=[query_embedding], n_results=limit)

    documents = result.get("documents", [[]])[0]
    metadatas = result.get("metadatas", [[]])[0]
    distances = result.get("distances", [[]])[0]

    chunks = []
    for index, document in enumerate(documents):
        metadata = metadatas[index] if index < len(metadatas) else {}
        distance = distances[index] if index < len(distances) else None
        chunks.append(
            {
                "document": document,
                "source": metadata.get("source", "unknown"),
                "chunk_id": metadata.get("chunk_id", index),
                "distance": distance,
            }
        )

    return chunks
