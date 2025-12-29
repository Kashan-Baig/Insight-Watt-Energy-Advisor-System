from typing import Dict, Any


def user_context_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    User Context Agent

    Responsibility:
    - Convert raw user questionnaire answers into a normalized behavior profile

    Expected state inputs:
    - state["answers"]: Dict[str, str]

    State outputs:
    - state["user_profile"]: Dict[str, Any]
    """

    if "answers" not in state:
        raise ValueError("User Context Agent requires `answers` in state")

    answers = state["answers"]

    profile = {
        # Household characteristics
        "occupancy_density": {
            "1-2": "low",
            "3-4": "medium",
            "5+": "high"
        }.get(answers.get("q1"), "low"),

        # Behavioral load likelihood
        "daytime_load_probability": {
            "Mostly empty": 0.1,
            "Partially occupied": 0.5,
            "Mostly occupied": 0.9
        }.get(answers.get("q2"), 0.2),

        # HVAC usage
        "hvac_usage": "active" if answers.get("q3") == "Yes" else "none",

        # Thermal comfort preference
        "thermal_comfort_setpoint": (
            answers.get("q3_1") if answers.get("q3") == "Yes" else None
        ),

        # Water heating system
        "water_heating_source": (
            str(answers.get("q4")).lower() if answers.get("q4") else "none"
        ),

        # Appliance load tier
        "appliance_load_tier": {
            "0-1": "low",
            "2-3": "moderate",
            "4+": "heavy"
        }.get(answers.get("q5"), "low")
    }

    return {
        "user_profile": profile
    }
