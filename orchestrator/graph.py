from langgraph.graph import StateGraph

from orchestrator.classifier import classify_intent
from orchestrator.router import route_intent
from orchestrator.tools.chat import chat_handler
from orchestrator.tools.chroma_tool import chroma_tool
from orchestrator.tools.postgres_tool import postgres_tool
from orchestrator.tools.unknown import unknown_handler

def classifier_node(state):
    return {
        "intent": classify_intent(state["query"]),
        "query": state["query"]
    }

def router_node(state):
    return state

builder = StateGraph(dict)

builder.add_node("classifier", classifier_node)
builder.add_node("router", router_node)

builder.add_node("chroma", chroma_tool)
builder.add_node("postgres", postgres_tool)
builder.add_node("chat", chat_handler)
builder.add_node("unknown", unknown_handler)

builder.set_entry_point("classifier")

builder.add_edge("classifier", "router")

builder.add_conditional_edges(
    "router",
    route_intent,
    {
        "chroma": "chroma",
        "postgres": "postgres",
        "chat": "chat",
        "unknown": "unknown",
    },
)

builder.set_finish_point("chroma")
builder.set_finish_point("postgres")
builder.set_finish_point("chat")
builder.set_finish_point("unknown")

graph = builder.compile()
