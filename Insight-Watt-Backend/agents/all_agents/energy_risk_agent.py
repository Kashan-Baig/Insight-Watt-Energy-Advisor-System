# agents/agents/energy_rizk_agent.py

from typing import Dict, Any
import pandas as pd
from pathlib import Path

def energy_risk_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph Node: Energy Risk & Optimization Agent
    
    Responsibility:
    - Use energy and weather forecasts from state
    - Identify high-risk days (high cost/usage)
    - Correlate risks with weather drivers (heatwaves/humidity)
    
    Expected state inputs:
    - state["energy_forecast_df"]: 7-day energy predictions
    - state["weather_forecast_df"]: 7-day weather forecast
    
    State outputs:
    - state["risk_report"]
    
    Note: Returns empty dict if required data is not yet available (fan-in pattern).
    """
    
    # Check for required state keys - return empty if not ready (fan-in)
    if "energy_forecast_df" not in state or state.get("energy_forecast_df") is None:
        print("⏳ Energy Risk Agent waiting for energy_forecast_df...")
        return {}
    if "weather_forecast_df" not in state or state.get("weather_forecast_df") is None:
        print("⏳ Energy Risk Agent waiting for weather_forecast_df...")
        return {}
    
    # Validate the dataframes have expected columns
    df_energy = state["energy_forecast_df"]
    df_weather = state["weather_forecast_df"]
    
    if not isinstance(df_energy, pd.DataFrame) or "datetime" not in df_energy.columns:
        print("⏳ Energy Risk Agent waiting for valid energy_forecast_df...")
        return {}
    if not isinstance(df_weather, pd.DataFrame) or "datetime" not in df_weather.columns:
        print("⏳ Energy Risk Agent waiting for valid weather_forecast_df...")
        return {}
    
    # If we already have a populated risk_report, don't regenerate
    if state.get("risk_report") and state.get("risk_report").get("total_risk_days") is not None:
        return {}
    
    print("🔍 Running Energy Risk Agent...")
    
    # Load forecasts from state
    df_energy = df_energy.copy()
    df_weather = df_weather.copy()
    
    df_energy["datetime"] = pd.to_datetime(df_energy["datetime"])
    df_weather["datetime"] = pd.to_datetime(df_weather["datetime"])
    
    # Daily Aggregation for Energy
    df_energy_daily = df_energy.resample('D', on='datetime').agg({
        "predicted_usage": "sum"
    }).reset_index()
    
    # Daily Aggregation for Weather
    df_weather_daily = df_weather.resample('D', on='datetime').agg({
        "Temperature": "mean",
        "Humidity": "mean",
        "Wind Speed": "mean"
    }).reset_index()
    
    # Merge Energy with Weather Forecast
    df_risk = pd.merge(df_energy_daily, df_weather_daily, on="datetime", how="left")
    
    # Define Risk Thresholds (Top 20% of usage)
    usage_threshold = df_risk["predicted_usage"].quantile(0.8)
    
    risk_days = []
    for _, row in df_risk.iterrows():
        is_risk = False
        reasons = []
        
        # Reason 1: High Temperature Spike
        if row["Temperature"] >= 35:
            is_risk = True
            reasons.append(f"Heatwave detected ({row['Temperature']:.1f}°C)")
            
        # Reason 2: High Humidity leading to AC load
        if row["Humidity"] > 75:
            is_risk = True
            reasons.append(f"High Humidity ({row['Humidity']:.1f}%) increasing perceived heat")
            
        # Reason 3: Unusual Usage Volume
        if row["predicted_usage"] > usage_threshold:
            is_risk = True
            reasons.append("Predicted usage exceeds typical baseline")

        if is_risk:
            risk_days.append({
                "date": row["datetime"].strftime("%Y-%m-%d"),
                "total_usage_kw": round(row["predicted_usage"], 2),
                "reasons": reasons,
                "severity": "High" if row["predicted_usage"] > usage_threshold else "Medium"
            })

    print(f"⚠️ Risk Assessment: {len(risk_days)} high-risk days identified")
    
    # Prepare final payload for the LLM or UI
    return {
        "risk_report": {
            "total_risk_days": len(risk_days),
            "risk_details": risk_days,
            "summary": f"Identified {len(risk_days)} days with potential energy spikes due to weather conditions."
        }
    }