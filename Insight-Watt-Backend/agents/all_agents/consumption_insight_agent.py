# agents/agents/consumption_insight_agent.py

from typing import Dict, Any
import pandas as pd

import pandas as pd
import numpy as np
import calendar


def extract_llm_features(df):
    """
    Input:
        df : raw DataFrame with columns
             - datetime
             - use_at_kw
             - Temperature
             - Humidity
             - Wind Speed

    Output:
        dict : LLM-ready compact feature payload
    """

    # ---------- SET DATETIME INDEX ----------
    df = df.copy()
    if "datetime" in df.columns:
        df["datetime"] = pd.to_datetime(df["datetime"])
        df.set_index("datetime", inplace=True)
    else:
        # already indexed
        df.index = pd.to_datetime(df.index)

    total_hours = len(df)

    # ---------- BASIC TIME FEATURES ----------
    df["hour"] = df.index.hour
    df["weekday"] = df.index.weekday
    df["is_weekend"] = df["weekday"] >= 5
    df["date"] = df.index.date
    df["month"] = df.index.month

    payload = {}

    # =====================================================
    # 🔹 USAGE BEHAVIOR FEATURES
    # =====================================================

    # ---------- PEAK HOURS ----------
    hourly_avg = df.groupby("hour")["use_at_kw"].mean()
    threshold = 0.8 * hourly_avg.max()
    peak_hours = hourly_avg[hourly_avg >= threshold].index.tolist()

    # ---------- PEAK MONTHS ----------
    monthly_kwh = df.groupby("month")["use_at_kw"].sum()
    top_months = monthly_kwh.nlargest(3)

    # ---------- WEEKEND VS WEEKDAY ----------
    daily = df.groupby(["date", "is_weekend"])["use_at_kw"].sum().reset_index()
    avg_weekday = daily[daily["is_weekend"] == False]["use_at_kw"].mean()
    avg_weekend = daily[daily["is_weekend"] == True]["use_at_kw"].mean()

    weekend_delta = (
        (avg_weekend - avg_weekday) / avg_weekday * 100
        if avg_weekday > 0 else 0
    )

    if weekend_delta > 10:
        weekend_behavior = "weekend-heavy"
    elif weekend_delta < -10:
        weekend_behavior = "weekday-heavy"
    else:
        weekend_behavior = "balanced"

    payload["usage_behavior"] = {
        "peak_hours": peak_hours,
        "peak_months": [calendar.month_name[m] for m in top_months.index],
        "weekend_behavior": weekend_behavior,
        "weekend_increase_percent": round(float(weekend_delta), 2)
    }

    # =====================================================
    # 🔹 SPIKE PROFILE
    # =====================================================

    spike_threshold = df["use_at_kw"].mean() + 2 * df["use_at_kw"].std()
    df["spike"] = df["use_at_kw"] > spike_threshold
    spike_count = int(df["spike"].sum())

    if spike_count > 0:
        spike_hours = df[df["spike"]].groupby("hour")["spike"].sum()
        spike_peak_hours = spike_hours[
            spike_hours >= 0.5 * spike_hours.max()
        ].index.tolist()

        weekend_spikes = (df[df["spike"]]["weekday"] >= 5).sum()

        payload["spike_profile"] = {
            "spike_rate_percent": round(spike_count / total_hours * 100, 1),
            "avg_spike_kw": round(float(df[df["spike"]]["use_at_kw"].mean()), 2),
            "spike_peak_hours": spike_peak_hours,
            "weekend_spike_percent": round(
                weekend_spikes / spike_count * 100, 1
            )
        }
    else:
        payload["spike_profile"] = {
            "spike_rate_percent": 0,
            "avg_spike_kw": 0,
            "spike_peak_hours": [],
            "weekend_spike_percent": 0
        }

    # =====================================================
    # 🔹 WEATHER CONTEXT
    # =====================================================

    avg_temp = float(df["Temperature"].mean())
    avg_humidity = float(df["Humidity"].mean())
    avg_wind = float(df["Wind Speed"].mean())

    heat_stress = df["Temperature"] + 0.1 * df["Humidity"]
    temp_corr = df["Temperature"].corr(df["use_at_kw"])

    if avg_temp >= 30:
        thermal_condition = "hot"
    elif avg_temp >= 25:
        thermal_condition = "warm"
    else:
        thermal_condition = "mild"

    if avg_humidity > 70:
        humidity_level = "high"
    elif avg_humidity > 50:
        humidity_level = "moderate"
    else:
        humidity_level = "low"

    if avg_wind > 10:
        wind_effect = "good-ventilation"
    elif avg_wind > 5:
        wind_effect = "moderate"
    else:
        wind_effect = "poor-ventilation"

    if temp_corr > 0.4:
        weather_driver = "cooling-driven"
    elif temp_corr < -0.4:
        weather_driver = "heating-driven"
    else:
        weather_driver = "weather-neutral"

    payload["weather_context"] = {
        "avg_temp_c": round(avg_temp, 1),
        "thermal_condition": thermal_condition,
        "humidity_level": humidity_level,
        "wind_cooling_effect": wind_effect,
        "heat_stress_index": round(float(heat_stress.mean()), 1),
        "temp_kwh_correlation": round(float(temp_corr), 2),
        "weather_driver": weather_driver
    }

    return payload



def consumption_insight_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph Node: Consumption Insight Agent

    Responsibilities:
    - Accept merged consumption + weather dataframe
    - Extract compact, LLM-ready behavioral insights
    - Return structured payload for downstream agents

    Expected state inputs:
    - state["merged_df"] : pandas DataFrame (from merge_csv_weather_node)

    State outputs:
    - state["consumption_insights"]
    """
    print("📊 Running Consumption Insight Agent...")
    
    if "merged_df" not in state:
        raise ValueError("Consumption Insight Agent requires `merged_df` in state")

    df: pd.DataFrame = state["merged_df"].copy()
    print(f"   - Received merged_df with {len(df)} rows")
    
    # Handle column naming: rename "Usage (kW)" to "use_at_kw" for extract_llm_features
    if "Usage (kW)" in df.columns:
        df.rename(columns={"Usage (kW)": "use_at_kw"}, inplace=True)

    # 🔹 Extract compact behavioral + weather insights
    insight_payload = extract_llm_features(df)
    
    print(f"   - Extracted insights: {list(insight_payload.keys())}")
    print("✅ Consumption Insight Agent completed!")

    return {
        "consumption_insights": insight_payload
    }

