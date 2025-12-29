# agents/nodes.py
"""
LangGraph Processing Nodes
--------------------------
Contains node functions for data processing in the energy workflow:
- merge_csv_weather_node: Merges user CSV with Karachi weather data
- model_forecasted_node: Trains model and generates 7-day predictions
- weather_forecasted_node: Fetches live weather from Open-Meteo API
"""

from typing import Dict, Any
import pandas as pd
import numpy as np
import lightgbm as lgb
from pathlib import Path
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import requests
import tempfile

# ======================
# BASE PATHS
# ======================
BASE_DIR = Path(__file__).resolve().parents[1]
WEATHER_CSV_PATH = BASE_DIR / "ML" / "data" / "raw" / "weather" / "Karachi.csv"
MODELS_DIR = BASE_DIR / "data" / "output" / "models"


# ======================
# MERGE CSV WEATHER NODE
# ======================
def merge_csv_weather_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Node: Merge user's energy CSV with Karachi weather data.
    
    Reads:
        - state["house_csv_path"]: Path to user's energy CSV
        
    Writes:
        - state["merged_df"]: Merged DataFrame with energy + weather
    """
    if "house_csv_path" not in state:
        raise ValueError("merge_csv_weather_node requires `house_csv_path` in state")
    
    house_csv_path = state["house_csv_path"]
    
    # Load user's house data
    house_df = pd.read_csv(house_csv_path)
    house_df["datetime"] = pd.to_datetime(house_df["datetime"], format="mixed")
    house_df = house_df.sort_values("datetime").reset_index(drop=True)
    
    # Standardize column name if needed
    if "Usage (kW)" in house_df.columns:
        pass  # Already correct
    elif "use_at_kw" in house_df.columns:
        house_df.rename(columns={"use_at_kw": "Usage (kW)"}, inplace=True)
    
    # Load Karachi weather data
    weather_df = pd.read_csv(WEATHER_CSV_PATH)
    weather_df["datetime"] = pd.to_datetime(weather_df["datetime"], format="mixed")
    
    # Convert weather columns to numeric
    for col in weather_df.columns:
        if col != "datetime":
            weather_df[col] = pd.to_numeric(weather_df[col], errors="coerce")
    
    weather_df = weather_df.sort_values("datetime").reset_index(drop=True)
    
    # Expand weather to minute-level for merge
    weather_expanded = (
        weather_df[["datetime", "Temperature", "Humidity", "Wind Speed"]]
        .set_index("datetime")
        .resample("min")
        .ffill()
        .reset_index()
    )
    
    # Merge using merge_asof for time alignment
    merged_df = pd.merge_asof(
        house_df[["datetime", "Usage (kW)"]].sort_values("datetime"),
        weather_expanded.sort_values("datetime"),
        on="datetime"
    )
    
    print(f"✅ Merged CSV: {len(merged_df)} rows (house + Karachi weather)")
    
    return {"merged_df": merged_df}


# ======================
# MODEL FORECASTED NODE
# ======================
def model_forecasted_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Node: Train LightGBM model and generate 7-day energy forecast.
    
    Reads:
        - state["merged_df"]: Merged energy + weather DataFrame
        - state["weather_forecast_df"]: Live weather forecast for predictions
        
    Writes:
        - state["trained_model_path"]: Path to saved model
        - state["energy_forecast_df"]: 7-day hourly predictions
    """
    if "merged_df" not in state:
        raise ValueError("model_forecasted_node requires `merged_df` in state")
    
    df = state["merged_df"].copy()
    
    # ===== FEATURE ENGINEERING =====
    df["datetime"] = pd.to_datetime(df["datetime"])
    df["hour"] = df["datetime"].dt.hour
    df["day_of_week"] = df["datetime"].dt.dayofweek
    df["is_weekend"] = df["day_of_week"].isin([5, 6]).astype(int)
    df["month"] = df["datetime"].dt.month
    
    # Cyclical encoding
    df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24)
    
    # Lag features
    target = "Usage (kW)"
    df["lag_1"] = df[target].shift(1)
    df["lag_15"] = df[target].shift(15)
    df["lag_60"] = df[target].shift(60)
    df["lag_1440"] = df[target].shift(1440)
    
    # Rolling features
    df["rolling_mean_60"] = df[target].shift(1).rolling(60).mean()
    df["rolling_std_60"] = df[target].shift(1).rolling(60).std()
    
    df = df.dropna().reset_index(drop=True)
    
    print(f"📈 Preparing model training with {len(df)} samples...")
    
    # ===== TRAIN MODEL =====
    X = df.drop(columns=["Usage (kW)", "datetime"])
    y = df["Usage (kW)"]
    
    split = int(len(df) * 0.8)
    X_train, X_val = X.iloc[:split], X.iloc[split:]
    y_train, y_val = y.iloc[:split], y.iloc[split:]
    
    print(f"🔧 Training LightGBM model (train={len(X_train)}, val={len(X_val)})...")
    
    model = lgb.LGBMRegressor(
        n_estimators=500,  # Reduced for faster training
        learning_rate=0.05,
        max_depth=8,
        random_state=42,
        verbose=-1,
        n_jobs=-1  # Use all CPU cores
    )
    
    model.fit(X_train, y_train)
    y_pred = model.predict(X_val)
    
    metrics = {
        "mae": mean_absolute_error(y_val, y_pred),
        "rmse": mean_squared_error(y_val, y_pred) ** 0.5,
        "r2": r2_score(y_val, y_pred),
    }
    print(f"📊 Model Metrics: MAE={metrics['mae']:.4f}, RMSE={metrics['rmse']:.4f}, R²={metrics['r2']:.4f}")
    
    # Save model
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    model_path = MODELS_DIR / "dynamic_lgb_model.txt"
    model.booster_.save_model(str(model_path))
    print(f"💾 Model saved to: {model_path}")
    
    # ===== GENERATE 7-DAY FORECAST =====
    # Use weather forecast from state if available, otherwise use last known values
    if "weather_forecast_df" in state and state["weather_forecast_df"] is not None:
        weather_forecast = state["weather_forecast_df"].copy()
    else:
        # Fallback: create synthetic forecast from last known weather
        last_date = df["datetime"].max()
        future_dates = pd.date_range(start=last_date + pd.Timedelta(hours=1), periods=168, freq="h")
        weather_forecast = pd.DataFrame({
            "datetime": future_dates,
            "Temperature": df["Temperature"].tail(24).mean(),
            "Humidity": df["Humidity"].tail(24).mean(),
            "Wind Speed": df["Wind Speed"].tail(24).mean()
        })
    
    # Prepare future features
    future_df = weather_forecast.copy()
    future_df["datetime"] = pd.to_datetime(future_df["datetime"])
    future_df["hour"] = future_df["datetime"].dt.hour
    future_df["day_of_week"] = future_df["datetime"].dt.dayofweek
    future_df["is_weekend"] = future_df["day_of_week"].isin([5, 6]).astype(int)
    future_df["month"] = future_df["datetime"].dt.month
    future_df["hour_sin"] = np.sin(2 * np.pi * future_df["hour"] / 24)
    future_df["hour_cos"] = np.cos(2 * np.pi * future_df["hour"] / 24)
    
    # Use average values for lag features (no historical data for future)
    avg_usage = df["Usage (kW)"].mean()
    for lag in [1, 15, 60, 1440]:
        future_df[f"lag_{lag}"] = avg_usage
    future_df["rolling_mean_60"] = avg_usage
    future_df["rolling_std_60"] = df["Usage (kW)"].std()
    
    # Predict
    feature_cols = [c for c in X.columns]
    X_future = future_df[feature_cols]
    predictions = model.predict(X_future)
    
    # Create forecast DataFrame
    energy_forecast_df = pd.DataFrame({
        "datetime": future_df["datetime"],
        "predicted_usage": predictions
    })
    
    print(f"⚡ Generated 7-day forecast: {len(energy_forecast_df)} hours")
    
    return {
        "trained_model_path": str(model_path),
        "energy_forecast_df": energy_forecast_df
    }


# ======================
# WEATHER FORECASTED NODE
# ======================
def weather_forecasted_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Node: Fetch 7-day weather forecast from Open-Meteo API.
    
    Uses Karachi coordinates (lat=24.8607, lon=67.0011).
    
    Writes:
        - state["weather_forecast_df"]: 7-day hourly weather forecast
    """
    # Karachi coordinates
    LAT = 24.8607
    LON = 67.0011
    
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": LAT,
        "longitude": LON,
        "hourly": "temperature_2m,relative_humidity_2m,wind_speed_10m",
        "timezone": "auto",
        "forecast_days": 7
    }
    
    try:
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        hourly = data["hourly"]
        weather_forecast_df = pd.DataFrame({
            "datetime": pd.to_datetime(hourly["time"]),
            "Temperature": hourly["temperature_2m"],
            "Humidity": hourly["relative_humidity_2m"],
            "Wind Speed": hourly["wind_speed_10m"]
        })
        
        print(f"🌤️ Fetched live weather: {len(weather_forecast_df)} hours from Open-Meteo")
        
    except Exception as e:
        print(f"⚠️ Weather API failed: {e}. Using fallback data.")
        # Fallback: generate synthetic weather data
        future_dates = pd.date_range(start=pd.Timestamp.now(), periods=168, freq="h")
        weather_forecast_df = pd.DataFrame({
            "datetime": future_dates,
            "Temperature": 32.0,  # Karachi average
            "Humidity": 70.0,
            "Wind Speed": 15.0
        })
    
    return {"weather_forecast_df": weather_forecast_df}


# ======================
# FORECAST INSIGHT NODE
# ======================
def forecast_insight_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Node: Analyze forecast data with LLM to generate insights.
    
    Takes the 168-row (24h * 7 days) forecast from model_forecasted_node
    and uses Gemini LLM to generate:
    1. forecast_summary: Explanation for frontend display below graph
    2. forecast_insights: Key patterns to enhance advisor agent context
    
    Reads:
        - state["energy_forecast_df"]: 7-day hourly predictions (168 rows)
        - state["weather_forecast_df"]: 7-day weather forecast
        
    Writes:
        - state["forecast_analysis"]: Dict with summary and insights
    """
    import os
    import json
    from groq import Groq
    
    # Check for required data - return empty if not ready (fan-in)
    if "energy_forecast_df" not in state or state.get("energy_forecast_df") is None:
        print("⏳ Forecast Insight Node waiting for energy_forecast_df...")
        return {}
    
    df_forecast = state["energy_forecast_df"]
    
    if not isinstance(df_forecast, pd.DataFrame) or "datetime" not in df_forecast.columns:
        print("⏳ Forecast Insight Node waiting for valid forecast data...")
        return {}
    
    # Skip if already have analysis
    if state.get("forecast_analysis") and state.get("forecast_analysis").get("forecast_summary"):
        return {}
    
    print("🔮 Running Forecast Insight Analysis with LLM...")
    
    # Prepare forecast data for LLM
    df = df_forecast.copy()
    df["datetime"] = pd.to_datetime(df["datetime"])
    df["date"] = df["datetime"].dt.date
    df["hour"] = df["datetime"].dt.hour
    df["day_name"] = df["datetime"].dt.day_name()
    
    # Create daily summary for context
    daily_summary = df.groupby("date").agg({
        "predicted_usage": ["sum", "mean", "max", "min"]
    }).reset_index()
    daily_summary.columns = ["date", "total_kwh", "avg_kwh", "max_kwh", "min_kwh"]
    
    # Calculate overall statistics
    total_7day_usage = df["predicted_usage"].sum()
    avg_hourly = df["predicted_usage"].mean()
    max_hourly = df["predicted_usage"].max()
    min_hourly = df["predicted_usage"].min()
    
    # Find peak hours across the week
    hourly_avg = df.groupby("hour")["predicted_usage"].mean()
    peak_hours = hourly_avg.nlargest(5).index.tolist()
    low_hours = hourly_avg.nsmallest(5).index.tolist()
    
    # Include weather context if available
    weather_context = ""
    if "weather_forecast_df" in state and state.get("weather_forecast_df") is not None:
        df_weather = state["weather_forecast_df"]
        if isinstance(df_weather, pd.DataFrame) and "Temperature" in df_weather.columns:
            avg_temp = df_weather["Temperature"].mean()
            max_temp = df_weather["Temperature"].max()
            weather_context = f"""
Weather Context:
- Average temperature: {avg_temp:.1f}°C
- Maximum temperature: {max_temp:.1f}°C
"""
    
    # Build LLM prompt with full hourly data
    forecast_table = df[["datetime", "predicted_usage", "day_name", "hour"]].to_string(index=False)
    
    prompt = f"""You are an energy consumption analyst. Analyze this 7-day hourly energy forecast for a residential user.

FORECAST DATA (168 hourly predictions):
{forecast_table}

DAILY SUMMARY:
{daily_summary.to_string(index=False)}

STATISTICS:
- Total predicted usage (7 days): {total_7day_usage:.2f} kWh
- Average hourly usage: {avg_hourly:.3f} kW
- Peak hourly usage: {max_hourly:.3f} kW
- Minimum hourly usage: {min_hourly:.3f} kW
- Peak hours (avg): {peak_hours}
- Low usage hours (avg): {low_hours}
{weather_context}

Generate a JSON response with EXACTLY this structure:
{{
    "forecast_summary": "A clear 2-3 sentence summary explaining the forecast for the user. Mention total expected usage, daily patterns, and key peak periods. This will be displayed below the forecast graph on the frontend.",
    "forecast_insights": [
        "Insight 1: Specific pattern observed (e.g., morning peaks, weekend variations)",
        "Insight 2: Notable trend or anomaly",
        "Insight 3: Actionable observation about consumption timing",
        "Insight 4: Weather correlation or seasonal pattern",
        "Insight 5: Potential optimization opportunity"
    ],
    "daily_breakdown": {{
        "highest_day": "Day name with highest usage",
        "lowest_day": "Day name with lowest usage",
        "pattern_type": "One of: weekday-heavy, weekend-heavy, consistent, variable"
    }}
}}

Return ONLY valid JSON, no markdown or extra text."""

    # Call Groq API
    try:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not set")
        
        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {"role": "system", "content": "You are an energy consumption analyst. Always respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2048
        )
        
        # Parse response
        response_text = response.choices[0].message.content.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        analysis = json.loads(response_text)
        
        print(f"✅ Forecast analysis generated: {len(analysis.get('forecast_insights', []))} insights")
        
        return {"forecast_analysis": analysis}
        
    except Exception as e:
        print(f"⚠️ LLM forecast analysis failed: {e}")
        # Return fallback analysis
        return {
            "forecast_analysis": {
                "forecast_summary": f"Your predicted energy consumption for the next 7 days is {total_7day_usage:.1f} kWh total, averaging {avg_hourly:.2f} kW per hour. Peak usage is expected around hours {peak_hours[:3]}.",
                "forecast_insights": [
                    f"Peak consumption hours are typically around {peak_hours[:3]}",
                    f"Lowest usage expected during hours {low_hours[:3]}",
                    f"Maximum hourly consumption predicted: {max_hourly:.2f} kW",
                    f"Daily average consumption: {total_7day_usage/7:.1f} kWh",
                    "Consider shifting high-power activities to low-usage hours"
                ],
                "daily_breakdown": {
                    "highest_day": str(daily_summary.loc[daily_summary["total_kwh"].idxmax(), "date"]),
                    "lowest_day": str(daily_summary.loc[daily_summary["total_kwh"].idxmin(), "date"]),
                    "pattern_type": "variable"
                }
            }
        }
