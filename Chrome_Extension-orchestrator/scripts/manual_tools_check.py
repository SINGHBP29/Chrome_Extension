from orchestrator.tools.postgres_tool import postgres_tool
from orchestrator.tools.chroma_tool import chroma_tool


def main() -> None:
    print("--- Manual Postgres Tool Check ---")
    pg_result = postgres_tool.invoke("how many interns are working for Visa?")
    print("Result:")
    print(pg_result)

    print("\n--- Manual Chroma Tool Check ---")
    ch_result = chroma_tool.invoke("what was discussed about Rosetta?")
    print("Result:")
    print(ch_result)


if __name__ == "__main__":
    main()

