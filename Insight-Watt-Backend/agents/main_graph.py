# agents/main_graph.py
"""
LangGraph Energy Workflow with Parallel Execution
-------------------------------------------------
Uses reducer-based state management to enable parallel node
execution with proper fan-in convergence.
"""

from langgraph.graph import StateGraph, START, END

from agents.agent_state import EnergyAgentState

# Import agents (pure functions, no LangGraph inside them)
from agents.all_agents.user_context_agent import user_context_agent
from agents.all_agents.consumption_insight_agent import consumption_insight_agent
from agents.all_agents.energy_risk_agent import energy_risk_agent
from agents.all_agents.energy_advisor_agent import energy_advisor_agent

# Import processing nodes
from agents.nodes import (
    merge_csv_weather_node,
    model_forecasted_node,
    weather_forecasted_node,
    forecast_insight_node,  # NEW: LLM analysis of forecast
)


def build_energy_agent_graph():
    """
    Build the LangGraph energy workflow with PARALLEL EXECUTION.
    
    Workflow Diagram (Updated with forecast_insight_node):
    ------------------------------------------------------
                           ┌─→ user_context_agent ───────────────────────────────────────┐
                           │                                                              │
    START ─────────────────┼─→ merge_csv_weather ─┬─→ consumption_insight_agent ─────────┤
                           │                      │                                       │
                           │                      └─→ model_forecasted ──┬─→ forecast_insight ──┤
                           │                                             │                │
                           └─→ weather_forecasted ───────────────────────┴─→ energy_risk_agent ─┴─→ energy_advisor_agent → END
    
    NEW Node: forecast_insight_node
    - Runs AFTER model_forecasted (needs energy_forecast_df)
    - Uses LLM to analyze 168 hourly predictions
    - Generates:
      1. forecast_summary: For frontend display below graph
      2. forecast_insights: Additional context for energy_advisor_agent
    - Feeds into energy_advisor_agent
    
    Parallel Execution:
    - user_context_agent, merge_csv_weather, weather_forecasted run in PARALLEL
    - consumption_insight_agent, model_forecasted run in PARALLEL (after merge)
    - forecast_insight_node runs after model_forecasted
    - energy_risk_agent waits for model_forecasted AND weather_forecasted
    - energy_advisor_agent waits for ALL upstream agents (including forecast_insight)
    """

    workflow = StateGraph(EnergyAgentState)

    # ===== Add Nodes =====
    workflow.add_node("user_context_agent", user_context_agent)
    workflow.add_node("merge_csv_weather", merge_csv_weather_node)
    workflow.add_node("weather_forecasted", weather_forecasted_node)
    workflow.add_node("consumption_insight_agent", consumption_insight_agent)
    workflow.add_node("model_forecasted", model_forecasted_node)
    workflow.add_node("forecast_insight", forecast_insight_node)  # NEW
    workflow.add_node("energy_risk_agent", energy_risk_agent)
    workflow.add_node("energy_advisor_agent", energy_advisor_agent)

    # ===== Add Edges (PARALLEL execution with fan-in) =====
    
    # TIER 1: Three parallel branches from START
    workflow.add_edge(START, "user_context_agent")
    workflow.add_edge(START, "merge_csv_weather")
    workflow.add_edge(START, "weather_forecasted")
    
    # TIER 2: After merge_csv_weather, two parallel branches
    workflow.add_edge("merge_csv_weather", "consumption_insight_agent")
    workflow.add_edge("merge_csv_weather", "model_forecasted")
    
    # TIER 3: After model_forecasted, two parallel branches
    workflow.add_edge("model_forecasted", "forecast_insight")  # NEW: LLM analysis
    workflow.add_edge("model_forecasted", "energy_risk_agent")
    workflow.add_edge("weather_forecasted", "energy_risk_agent")
    
    # TIER 4: energy_advisor_agent needs ALL upstream outputs (fan-in from 4 sources)
    workflow.add_edge("user_context_agent", "energy_advisor_agent")
    workflow.add_edge("consumption_insight_agent", "energy_advisor_agent")
    workflow.add_edge("energy_risk_agent", "energy_advisor_agent")
    workflow.add_edge("forecast_insight", "energy_advisor_agent")  # NEW
    
    # Final output
    workflow.add_edge("energy_advisor_agent", END)

    return workflow.compile()
