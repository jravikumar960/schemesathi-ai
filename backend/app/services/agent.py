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
    # Derived matching facts are computed here, not inserted into extracted user facts.
    profile = dict(profile)
    if "monthly_family_income" in profile and "annual_family_income" not in profile:
        profile["annual_family_income"] = profile["monthly_family_income"] * 12
    income_check = evaluate_post_matric_income(profile)
    if income_check.get("status") in ("PASS", "FAIL"):
        profile["income_within_limit"] = income_check["status"] == "PASS"
    # Telangana residence must be established by the input/parser, never guessed.
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
    results = state.get("results", [])
    eligible = [r for r in results if r.get("status") == "ELIGIBLE"]
    pending = [r for r in results if r.get("status") == "NEEDS_INFORMATION"]
    income = state.get("post_matric_income") or {}
    if eligible:
        intro = f"{len(eligible)} programme(s) match all recorded checks; likely eligible, not guaranteed."
    elif pending:
        intro = "Some programmes may fit, but more information is required before recommending them."
    else:
        intro = "No verified programme can currently be recommended; this is a preliminary assessment."
    if income.get("status"):
        intro += f" Telangana Post-Matric Scholarship income check: {income['status']}."
        if income.get("reason"):
            intro += f" {income['reason']}"
        intro += " This is a preliminary assessment, not an official scholarship eligibility decision."
    return {"response": intro}


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


