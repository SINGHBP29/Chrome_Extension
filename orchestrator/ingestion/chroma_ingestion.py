from orchestrator.utils.meeting_store import rebuild_meeting_collection


def main():
    chunk_count = rebuild_meeting_collection()
    print(f"ChromaDB ingestion complete. Stored {chunk_count} chunks.")


if __name__ == "__main__":
    main()
