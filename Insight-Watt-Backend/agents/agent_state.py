# agents/agent_state.py
"""
LangGraph State with Reducer Functions
---------------------------------------
Uses Annotated types with custom reducers to enable proper
fan-in (parallel node convergence) state management.
"""

from typing import TypedDict, Dict, Any, Optional, Annotated
import pandas as pd


def merge_state(existing: Any, new: Any) -> Any:
    """
    Reducer function for fan-in patterns.
    Returns the new value if it's not None, otherwise keeps existing.
    This allows parallel nodes to update different state keys.
    """
    if new is not None:
        return new
    return existing


class EnergyAgentState(TypedDict, total=False):
    """
    Global LangGraph State with Reducers
    -------------------------------------
    Uses Annotated types with merge_state reducer to handle
    parallel node execution and fan-in patterns.
    
    Key insight: Each state key uses a reducer that merges updates
    from parallel branches, preventing race conditions.
    """

    # ===== Raw Inputs (no reducer needed - set once) =====
    answers: Dict[str, str]                   # From frontend questionnaire
    house_csv_path: str                       # Path to user's energy CSV file

    # ===== Intermediate Data (Processing Nodes) =====
    # These use reducers to allow parallel updates
    merged_df: Annotated[pd.DataFrame, merge_state]
    trained_model_path: Annotated[str, merge_state]
    energy_forecast_df: Annotated[pd.DataFrame, merge_state]
    weather_forecast_df: Annotated[pd.DataFrame, merge_state]

    # ===== Forecast Analysis (LLM) =====
    # Output from forecast_insight_node - LLM analysis of forecast data
    forecast_analysis: Annotated[Dict[str, Any], merge_state]
    # Contains:
    #   - forecast_summary: str (explanation for frontend below graph)
    #   - forecast_insights: List[str] (patterns for advisor agent context)

    # ===== Agent Outputs =====
    # These use reducers to allow parallel agent execution
    user_profile: Annotated[Dict[str, Any], merge_state]
    consumption_insights: Annotated[Dict[str, Any], merge_state]
    risk_report: Annotated[Dict[str, Any], merge_state]

    # ===== Final Output =====
    seven_day_energy_plan: Annotated[Dict[str, Any], merge_state]


def get_initial_state(
    answers: Dict[str, str],
    house_csv_path: str
) -> EnergyAgentState:
    """
    Initialize the LangGraph state with user inputs.
    
    Args:
        answers: User questionnaire responses
        house_csv_path: Absolute path to user's energy CSV file
        
    Returns:
        EnergyAgentState: Initial state for graph invocation
    """
    return EnergyAgentState(
        answers=answers,
        house_csv_path=house_csv_path
    )

