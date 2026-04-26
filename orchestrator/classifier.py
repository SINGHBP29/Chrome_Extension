from orchestrator.config import get_llm

INTENTS = [
    "MEETING_QUERY",
    "EMPLOYEE_QUERY",
    "GENERAL_CHAT",
    "UNKNOWN"
]

CLASSIFIER_PROMPT = """
You are an intent classifier.

Classify the user query into ONE of the following categories:

1. MEETING_QUERY → Questions about meetings, notes, discussions
2. EMPLOYEE_QUERY → Questions about employee details
3. GENERAL_CHAT → Greetings or casual talk
4. UNKNOWN → Anything else

Return ONLY the category name.

Query: {query}
"""

def classify_intent(query):
    llm = get_llm()

    prompt = CLASSIFIER_PROMPT.format(query=query)

    response = llm.invoke(prompt).content.strip()

    if response not in INTENTS:
        return "UNKNOWN"

    return response
