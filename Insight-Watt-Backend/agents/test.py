# agents/test.py
"""
Test script for the LangGraph Energy Workflow.

Usage:
    cd c:/Users/Zainab/Desktop/Insight-Watt-Backend
    python -m agents.test
"""

import pandas as pd
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from agents.main_graph import build_energy_agent_graph
from agents.agent_state import get_initial_state


def run_all_agents_once():
    print("\n🚀 Running Full Agentic Energy Pipeline...\n")

    # ----------------------------
    # User Inputs
    # ----------------------------
    answers = {
        "q1": "3-4",
        "q2": "Mostly occupied",
        "q3": "Yes",
        "q3_1": "22-24",
        "q4": "Electric geyser",
        "q5": "2-3"
    }

    # Path to user's energy CSV file
    # Update this path to point to a valid house CSV
    BASE_DIR = Path(__file__).resolve().parents[1]
    house_csv_path = str(BASE_DIR / "data" / "raw" / "houses" / "house_31.csv")
    
    print(f"📂 House CSV: {house_csv_path}")
    print(f"📝 User Answers: {answers}")

    # ----------------------------
    # Initialize State
    # ----------------------------
    initial_state = get_initial_state(
        answers=answers,
        house_csv_path=house_csv_path
    )

    # ----------------------------
    # Agent Graph Execution
    # ----------------------------
    print("\n⚙️ Building and executing workflow...")
    app = build_energy_agent_graph()
    final_state = app.invoke(initial_state)

    # ----------------------------
    # Results
    # ----------------------------
    print("\n" + "="*60)
    print("✅ Agents Executed Successfully")
    print("="*60)

    print("\n🔹 User Profile (Agent 1)")
    print(final_state.get("user_profile", "Not found"))

    print("\n🔹 Consumption Insights (Agent 2)")
    insights = final_state.get("consumption_insights", {})
    if insights:
        print(f"  - Peak Hours: {insights.get('usage_behavior', {}).get('peak_hours', [])}")
        print(f"  - Weather Driver: {insights.get('weather_context', {}).get('weather_driver', 'N/A')}")

    print("\n🔹 Energy Risk Report (Agent 3)")
    risk = final_state.get("risk_report", {})
    print(f"  - Total Risk Days: {risk.get('total_risk_days', 0)}")
    print(f"  - Summary: {risk.get('summary', 'N/A')}")

    print("\n🔹 7-Day Energy Plan (Agent 4)")
    plan = final_state.get("seven_day_energy_plan", {})
    if plan:
        print(f"  - Summary: {plan.get('summary', 'N/A')[:100]}...")
        print(f"  - Estimated Savings: {plan.get('estimated_savings_percent', 'N/A')}%")
        print(f"  - Comfort Impact: {plan.get('comfort_impact', 'N/A')}")

    print("\n🔹 Forecast Analysis (LLM Insights)")
    forecast_analysis = final_state.get("forecast_analysis", {})
    if forecast_analysis:
        print(f"  - Summary: {forecast_analysis.get('forecast_summary', 'N/A')[:150]}...")
        insights_list = forecast_analysis.get('forecast_insights', [])
        if insights_list:
            print("  - Key Insights:")
            for i, insight in enumerate(insights_list[:3], 1):
                print(f"    {i}. {insight[:80]}...")
    else:
        print("  - Not available")

    print("\n" + "="*60)
    print("🎯 ALL WORKFLOW NODES COMPLETED SUCCESSFULLY")
    print("="*60 + "\n")
    
    return final_state


if __name__ == "__main__":
    run_all_agents_once()

