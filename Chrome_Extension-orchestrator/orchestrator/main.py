from langchain_core.messages import HumanMessage
import psycopg2
from google.api_core.exceptions import PermissionDenied, ResourceExhausted
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

        try:
            result = agent_executor.invoke({"messages": [HumanMessage(content=query)]})

            # The last message is from the agent
            final_message = result["messages"][-1].content
            print("Bot:", final_message)
        except ResourceExhausted:
            print(
                "Bot: Gemini API quota/rate limit hit (HTTP 429). Wait a bit and try again, "
                "or increase quota/enable billing for your Google project."
            )
        except psycopg2.OperationalError:
            print(
                "Bot: PostgreSQL is not reachable. Start the DB and set `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD` "
                "in `.env`, then retry."
            )
        except psycopg2.Error:
            print("Bot: PostgreSQL query failed. Check the logs and DB schema.")
        except PermissionDenied:
            print(
                "Bot: Gemini API authentication failed (HTTP 403). Check that your `.env` has a valid "
                "`GOOGLE_API_KEY` (or `GEMINI_API_KEY`) and restart the backend."
            )
