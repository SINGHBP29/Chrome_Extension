from langchain_core.messages import HumanMessage
from orchestrator.agent import agent_executor

if __name__ == "__main__":
    while True:
        try:
            query = input("User: ")
        except (KeyboardInterrupt, EOFError):
            print()
            break

        if not query.strip():
            continue

        result = agent_executor.invoke({"messages": [HumanMessage(content=query)]})
        
        # The last message is from the agent
        final_message = result["messages"][-1].content
        print("Bot:", final_message)
