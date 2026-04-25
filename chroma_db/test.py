# test.py

import chromadb
import re

# =========================
# CONFIG
# =========================
CHROMA_PATH = "chroma_db/db"
COLLECTION_NAME = "meeting_notes"
DEFAULT_TOP_K = 3
FETCH_MULTIPLIER = 4
MAX_PREVIEW_CHARS = 450
MIN_RELEVANCE = 0.35
STOP_WORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "how",
    "i", "in", "is", "it", "of", "on", "or", "that", "the", "to", "was",
    "what", "when", "where", "which", "who", "will", "with", "you", "your",
}

# =========================
# LOAD DB
# =========================
def load_collection():
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    collection = client.get_collection(COLLECTION_NAME)
    return collection

# =========================
# QUERY FUNCTION
# =========================
def extract_source_filter(query):
    match = re.search(r"\bmeeting[_\s-]?(\d+)\b", query.lower())
    if not match:
        return None
    return f"meeting_{match.group(1)}.txt"


def tokenize_query(query):
    tokens = re.findall(r"[a-zA-Z0-9_]+", query.lower())
    return {token for token in tokens if token not in STOP_WORDS and len(token) > 1}


def normalize_text(text):
    return re.sub(r"\s+", " ", text).strip().lower()


def preview_text(text, limit=MAX_PREVIEW_CHARS):
    compact = re.sub(r"\s+", " ", text).strip()
    if len(compact) <= limit:
        return compact
    return compact[:limit].rstrip() + " ..."


def keyword_overlap_score(query_tokens, text):
    if not query_tokens:
        return 0.0
    text_tokens = set(re.findall(r"[a-zA-Z0-9_]+", text.lower()))
    overlap = len(query_tokens & text_tokens)
    return overlap / len(query_tokens)


def phrase_match_score(query, text):
    query_terms = [term for term in re.findall(r"[a-zA-Z0-9_]+", query.lower()) if term not in STOP_WORDS]
    if len(query_terms) < 2:
        return 0.0
    text_norm = normalize_text(text)
    matched = 0
    total = 0
    for i in range(len(query_terms) - 1):
        phrase = f"{query_terms[i]} {query_terms[i + 1]}"
        total += 1
        if phrase in text_norm:
            matched += 1
    if total == 0:
        return 0.0
    return matched / total


def semantic_score_from_distance(distance):
    if distance is None:
        return 0.0
    # Chroma distance: lower is better.
    return 1.0 / (1.0 + float(distance))


def normalize_distances(distances):
    clean = [float(d) for d in distances if d is not None]
    if not clean:
        return []
    min_d = min(clean)
    max_d = max(clean)
    if max_d - min_d < 1e-9:
        return [1.0 if d is not None else 0.0 for d in distances]
    normalized = []
    for d in distances:
        if d is None:
            normalized.append(0.0)
        else:
            # Lower distance => higher normalized similarity.
            normalized.append((max_d - float(d)) / (max_d - min_d))
    return normalized


def run_query(collection, query, top_k=DEFAULT_TOP_K):
    source_filter = extract_source_filter(query)
    query_tokens = tokenize_query(query)
    fetch_k = max(top_k, top_k * FETCH_MULTIPLIER)

    query_kwargs = {
        "query_texts": [query],
        "n_results": fetch_k,
        "include": ["documents", "metadatas", "distances"],
    }
    if source_filter:
        query_kwargs["where"] = {"source": source_filter}

    results = collection.query(**query_kwargs)

    print("\n" + "="*60)
    print(f"🔍 Query: {query}")
    print("="*60)
    if source_filter:
        print(f"📌 Source filter applied: {source_filter}")

    docs = results["documents"][0]
    if not docs:
        print("No matching results found.")
        return

    metadatas = results["metadatas"][0]
    distances = results.get("distances", [[None]])[0]
    normalized_semantic_scores = normalize_distances(distances)
    ranked_results = []
    seen_docs = set()

    for i, doc in enumerate(docs):
        normalized = normalize_text(doc)
        if normalized in seen_docs:
            continue
        seen_docs.add(normalized)

        semantic_score = semantic_score_from_distance(distances[i] if i < len(distances) else None)
        semantic_score_norm = normalized_semantic_scores[i] if i < len(normalized_semantic_scores) else semantic_score
        lexical_score = keyword_overlap_score(query_tokens, doc)
        phrase_score = phrase_match_score(query, doc)
        # Blend normalized semantic score with lexical/phrase intent signals.
        final_score = (
            (0.55 * semantic_score_norm)
            + (0.30 * lexical_score)
            + (0.15 * phrase_score)
        )

        ranked_results.append(
            {
                "doc": doc,
                "meta": metadatas[i],
                "semantic_score": semantic_score,
                "semantic_score_norm": semantic_score_norm,
                "lexical_score": lexical_score,
                "phrase_score": phrase_score,
                "final_score": final_score,
            }
        )

    ranked_results.sort(key=lambda item: item["final_score"], reverse=True)
    top_results = [item for item in ranked_results if item["final_score"] >= MIN_RELEVANCE][:top_k]

    if not top_results:
        print(
            f"No strong matches found (min relevance {int(MIN_RELEVANCE * 100)}%). "
            "Try rephrasing your query."
        )
        return

    for i, item in enumerate(top_results):
        meta = item["meta"]

        print(f"\nResult {i+1}")
        print(f"📄 Source: {meta['source']} | Chunk: {meta['chunk_id']}")
        confidence = item["final_score"] * 100
        print(
            f"Relevance: {confidence:.1f}% "
            f"(semantic={item['semantic_score_norm']:.3f}, keyword={item['lexical_score']:.3f}, phrase={item['phrase_score']:.3f})"
        )
        print(preview_text(item["doc"]))
        print("-"*60)


def interactive_query_loop(collection):
    print("\nInteractive mode enabled.")
    print("Type your query and press Enter.")
    print("Type 'exit' or 'quit' to stop.\n")

    while True:
        user_query = input("query> ").strip()

        if user_query.lower() in {"exit", "quit"}:
            print("Exiting interactive mode.")
            break

        if not user_query:
            print("Please enter a non-empty query.")
            continue

        run_query(collection, user_query)

# =========================
# MAIN
# =========================
if __name__ == "__main__":
    print("📦 Loading ChromaDB collection...")
    collection = load_collection()

    mode = input(
        "Choose mode: [1] predefined tests, [2] interactive queries (default: 2): "
    ).strip()

    if mode == "1":
        queries = [
            "technical requirements for capstone project",
            "features required in chrome extension",
            "what is chromadb used for",
            "deployment requirements for capstone",
        ]
        for q in queries:
            run_query(collection, q)
    else:
        interactive_query_loop(collection)
