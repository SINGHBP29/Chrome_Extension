from orchestrator.config import get_llm

def chat_handler(state):
    query = state["query"]

    llm = get_llm()

    prompt = f"""
    You are a friendly assistant.

    Respond naturally to:
    {query}
    """

    response = llm.invoke(prompt).content

    return {"response": response}
