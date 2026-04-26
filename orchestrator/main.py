from orchestrator.graph import graph

if __name__ == "__main__":
    while True:
        query = input("User: ")

        result = graph.invoke({"query": query})

        print("Bot:", result["response"])
