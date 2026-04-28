from langgraph.prebuilt import create_react_agent
from langchain_core.messages import SystemMessage
from orchestrator.config import get_llm
from orchestrator.tools.postgres_tool import postgres_tool
from orchestrator.tools.chroma_tool import chroma_tool

# Initialize the LLM
llm = get_llm()

# List of tools available to the agent
tools = [chroma_tool, postgres_tool]

# Create the system prompt
system_message = SystemMessage(content=(
    "You are a helpful AI assistant. You can use tools to look up employee information from the database or retrieve context from meeting notes. "
    "If the user asks a question, use the appropriate tool to find the answer. Provide clear, concise answers based on the tool results. "
    "If you do not know the answer or the tools return no results, clearly state that you don't know."
))

def state_modifier(state):
    if isinstance(state, dict) and "messages" in state:
        messages = state["messages"]
    elif isinstance(state, list):
        messages = state
    else:
        messages = []
    return [system_message] + list(messages)

# Create the agent
agent_executor = create_react_agent(
    model=llm,
    tools=tools,
    prompt=state_modifier
)
