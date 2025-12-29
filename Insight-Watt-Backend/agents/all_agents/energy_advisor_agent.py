# agents/agents/energy_advisor_agent.py

from typing import Dict, Any
import os
import json
from groq import Groq

# --------------------------------------------------
# Groq Client
# --------------------------------------------------

def get_groq_client():
    """Initialize and return a Groq client using API key from environment."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise EnvironmentError("GROQ_API_KEY not set in environment")
    return Groq(api_key=api_key)

# --------------------------------------------------
# Prompt Builder
# --------------------------------------------------

def build_energy_advice_prompt(
    user_profile: Dict[str, Any],
    consumption_insights: Dict[str, Any],
    risk_report: Dict[str, Any],
    forecast_analysis: Dict[str, Any] = None  # NEW: Forecast insights from LLM
) -> str:
    """
    Constructs a structured reasoning prompt for Gemini,
    using consumption insights, risk report, and forecast analysis.
    """
    
    # Build forecast context section if available
    forecast_context = ""
    if forecast_analysis:
        forecast_summary = forecast_analysis.get("forecast_summary", "")
        forecast_insights = forecast_analysis.get("forecast_insights", [])
        daily_breakdown = forecast_analysis.get("daily_breakdown", {})
        
        insights_text = "\n".join([f"  - {insight}" for insight in forecast_insights])
        
        forecast_context = f"""
---

### 7-Day Forecast Analysis
**Summary:** {forecast_summary}

**Key Patterns Identified:**
{insights_text}

**Daily Pattern:**
- Highest usage day: {daily_breakdown.get('highest_day', 'N/A')}
- Lowest usage day: {daily_breakdown.get('lowest_day', 'N/A')}
- Pattern type: {daily_breakdown.get('pattern_type', 'N/A')}

Use these forecast insights to make your recommendations more specific and actionable.
"""

    return f"""
You are an AI Energy Advisor.

Your role:
Provide a **polite, supportive, and advisory 7-day energy-saving plan**
that helps the user reduce electricity costs while maintaining comfort.

Tone & Style Guidelines:
- Be respectful and encouraging
- Use advisory language (e.g., "it is recommended", "you may consider")
- Avoid commands or forceful instructions
- Clearly explain the benefit of each action
- Frame suggestions as small, achievable improvements

Important:
- Do NOT suggest extreme or uncomfortable changes
- Do NOT assume the user will follow everything
- Emphasize savings and efficiency, not restriction

---

### User Lifestyle Profile
{json.dumps(user_profile, indent=2)}

---

### Electricity Consumption Insights
{json.dumps(consumption_insights, indent=2)}

---

### Energy Risk Report
{json.dumps(risk_report, indent=2)}
{forecast_context}
---

### Output Format (STRICT JSON)
Return ONLY valid JSON in this format:

{{
  "summary": "Brief, friendly explanation of the user's energy usage patterns and risk considerations",
  "estimated_savings_percent": number,
  "7_day_plan": {{
    "Day 1": [
      {{
        "action": "Advisory recommendation written politely",
        "reason": "Clear explanation of how this may reduce energy usage or mitigate risk"
      }}
    ],
    ...
    "Day 7": [
      {{
        "action": "...",
        "reason": "..."
      }}
    ]
  }},
  "comfort_impact": "low | moderate | high"
}}

Do NOT include markdown.
Do NOT include explanations outside JSON.
"""

# --------------------------------------------------
# Agent Function
# --------------------------------------------------

def energy_advisor_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Agent 4: Energy Advisor Agent

    Responsibility:
    - Combine insights from Agent 1, Agent 2, Agent 3, and forecast analysis
    - Generate a 7-day personalized energy-saving plan using Gemini
    
    Note: Returns empty dict if required data is not yet available (fan-in pattern).
    """
    print("🎯 Running Energy Advisor Agent...")
    print(f"   - State keys available: {list(state.keys())}")
    
    required_keys = [
        "user_profile",
        "consumption_insights",
        "risk_report"
    ]

    # Check if all required data is available - return empty if not ready (fan-in)
    missing_keys = [key for key in required_keys if key not in state or state.get(key) is None]
    if missing_keys:
        print(f"   ⏳ Waiting for: {missing_keys}")
        return {}
    
    # If we already have a populated plan, don't regenerate
    if state.get("seven_day_energy_plan") and state.get("seven_day_energy_plan").get("summary"):
        print("   ℹ️ Plan already generated, skipping...")
        return {}
    
    # Get optional forecast analysis (enhances context but not required)
    forecast_analysis = state.get("forecast_analysis")
    if forecast_analysis:
        print("   ✅ Using forecast analysis for enhanced context")
    else:
        print("   ⚠️ No forecast analysis available, proceeding without")

    # Initialize client and generate content
    client = get_groq_client()

    prompt = build_energy_advice_prompt(
        user_profile=state["user_profile"],
        consumption_insights=state["consumption_insights"],
        risk_report=state["risk_report"],
        forecast_analysis=forecast_analysis  # NEW: Include forecast insights
    )

    print("🤖 Generating 7-day energy plan with Groq...")
    
    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {"role": "system", "content": "You are an AI Energy Advisor. Always respond with valid JSON only."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
        max_tokens=4096
    )

    try:
        # Clean the response text (remove markdown code blocks if present)
        response_text = response.choices[0].message.content.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        plan = json.loads(response_text)
    except json.JSONDecodeError as e:
        print(f"⚠️ JSON parse error: {e}")
        print(f"Response text: {response.choices[0].message.content[:500]}...")
        raise ValueError("Groq response was not valid JSON")

    print("✅ 7-day energy plan generated successfully!")
    
    return {
        "seven_day_energy_plan": plan
    }

