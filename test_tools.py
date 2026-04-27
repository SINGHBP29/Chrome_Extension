from orchestrator.tools.postgres_tool import postgres_tool
from orchestrator.tools.chroma_tool import chroma_tool

print("--- Testing Postgres Tool ---")
pg_result = postgres_tool.invoke("how many interns are working for Visa?")
print("Result:")
print(pg_result)

print("\n--- Testing Chroma Tool ---")
ch_result = chroma_tool.invoke("what was discussed about Rosetta?")
print("Result:")
print(ch_result)
