from typing import Dict, Any
from concurrent.futures import ThreadPoolExecutor, as_completed

from agents.all_agents.user_context_agent import user_context_agent
from agents.all_agents.consumption_insight_agent import consumption_insight_agent
from agents.all_agents.energy_risk_agent import energy_risk_agent
from agents.all_agents.energy_advisor_agent import energy_advisor_agent

class AgentService:
    def __init__(self):
        pass  # You can initialize any config if needed

    def run_all_agents(self, user_input: Dict[str, Any], consumption_df, forecast_features=None) -> Dict[str, Any]:
        """
        Runs all 4 agents and returns a full result dictionary.
        """

        results = {}

        # ----- Run Agents 1–3 in parallel -----
        with ThreadPoolExecutor(max_workers=3) as executor:
            future_map = {
                executor.submit(user_context_agent, user_input): "user_profile",
                executor.submit(consumption_insight_agent, {"consumption_df": consumption_df}): "consumption_insights",
                executor.submit(energy_risk_agent, {"consumption_df": consumption_df}): "risk_report"
            }

            for future in as_completed(future_map):
                key = future_map[future]
                try:
                    results[key] = future.result()
                except Exception as e:
                    results[key] = {"error": str(e)}  # Safe logging instead of crashing

        # ----- Prepare state for Agent 4 (Energy Advisor) -----
        state = {
            "user_profile": results.get("user_profile"),
            "consumption_insights": results.get("consumption_insights"),
            "risk_report": results.get("risk_report")
        }

        # ----- Agent 4: Energy Advisor -----
        try:
            results["seven_day_energy_plan"] = energy_advisor_agent(state)
        except Exception as e:
            results["seven_day_energy_plan"] = {"error": str(e)}

        return results
