from orchestrator.config import get_llm
from orchestrator.utils.meeting_store import retrieve_meeting_chunks

def chroma_tool(state):
    query = state["query"]
    chunks = retrieve_meeting_chunks(query, limit=4)

    if not chunks:
        return {"response": "I don't know."}

    context = "\n\n".join(
        [
            f"Source: {chunk['source']} (chunk {chunk['chunk_id']})\n"
            f"{chunk['document']}"
            for chunk in chunks
        ]
    )

    llm = get_llm()

    prompt = f"""
    Answer ONLY using the context below.
    If answer is not present, say "I don't know."

    Context:
    {context}

    Question:
    {query}
    """

    response = llm.invoke(prompt).content

    return {"response": response}
