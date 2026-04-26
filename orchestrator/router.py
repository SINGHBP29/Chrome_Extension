def route_intent(state):
    intent = state["intent"]

    if intent == "MEETING_QUERY":
        return "chroma"

    elif intent == "EMPLOYEE_QUERY":
        return "postgres"

    elif intent == "GENERAL_CHAT":
        return "chat"

    return "unknown"