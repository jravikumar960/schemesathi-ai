from typing import Any, TypedDict

from langgraph.graph import StateGraph, START, END

from app.services.eligibility import evaluate_scheme
from app.services.post_matric_rules import evaluate_post_matric_income


class AgentState(TypedDict, total=False):
    profile: dict[str, Any]
    schemes: list[Any]
    results: list[dict[str, Any]]
    post_matric_income: dict[str, Any]
    response: str


def evaluate_node(state: AgentState) -> dict:
    profile = state.get("profile", {})
    schemes = state.get("schemes", [])

    return {
        "results": [
            evaluate_scheme(scheme, profile)
            for scheme in schemes
        ]
    }


def post_matric_node(state: AgentState) -> dict:
    profile = state.get("profile", {})

    return {
        "post_matric_income": evaluate_post_matric_income(profile)
    }


def explain_node(state: AgentState) -> dict:
    messages = []

    for result in state.get("results", []):
        if result["is_illustrative"]:
            continue

        # The official Post-Matric record has no complete generic
        # eligibility rules. Its dedicated income check is reported below.
        if result["scheme_slug"] == "telangana-post-matric-scholarships":
            continue

        messages.append(
            f'{result["scheme_name"]}: {result["status"]}'
        )

    income_result = state.get("post_matric_income", {})

    if income_result:
        status = income_result["status"]
        reason = income_result["reason"]

        messages.append(
            f"Telangana Post-Matric Scholarship income check: "
            f"{status}. {reason}"
        )

    messages.append(
        "This is a preliminary assessment, not an official "
        "scholarship eligibility decision."
    )

    return {"response": "\n".join(messages)}


def build_agent():
    graph = StateGraph(AgentState)

    graph.add_node("evaluate", evaluate_node)
    graph.add_node("post_matric", post_matric_node)
    graph.add_node("explain", explain_node)

    graph.add_edge(START, "evaluate")
    graph.add_edge("evaluate", "post_matric")
    graph.add_edge("post_matric", "explain")
    graph.add_edge("explain", END)

    return graph.compile()


agent = build_agent()

