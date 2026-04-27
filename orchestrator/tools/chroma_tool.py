from langchain_core.tools import tool
from orchestrator.utils.meeting_store import retrieve_meeting_chunks

@tool
def chroma_tool(query: str) -> str:
    """
    Search through recent company meeting transcripts and notes for specific topics, discussions, or context.
    Use this tool when answering questions about meetings, announcements, or general company discussions.
    """
    chunks = retrieve_meeting_chunks(query, limit=4)

    print(f"\n[Chroma Tool] Query run: '{query}'")
    if not chunks:
        print("[Chroma Tool] Result: No relevant meeting context found.")
        return "No relevant meeting context found."

    context = "\n\n".join(
        [
            f"Source: {chunk['source']} (chunk {chunk['chunk_id']})\n"
            f"{chunk['document']}"
            for chunk in chunks
        ]
    )

    print(f"[Chroma Tool] Result:\n{context}")
    return context
