# services/forecast_engine.py
import lightgbm as lgb
import pandas as pd
import numpy as np
from pathlib import Path
import os
import requests

# Directories
BASE_DIR = Path(__file__).resolve().parents[2]  # Insight-Watt-Backend
MODEL_DIR = BASE_DIR / "ML" / "models"
OUTPUT_DIR = BASE_DIR / "data" / "output"


def prepare_future_features(weather_forecast_df: pd.DataFrame, recent_usage_df: pd.DataFrame = None) -> pd.DataFrame:
    """
    Prepare features for future timestamps based on weather forecast and optional recent usage data.
    """
    df = weather_forecast_df.copy()
    df["datetime"] = pd.to_datetime(df["datetime"])
    df = df.sort_values("datetime").reset_index(drop=True)

    # Time features
    df["hour"] = df["datetime"].dt.hour
    df["day_of_week"] = df["datetime"].dt.dayofweek
    df["is_weekend"] = df["day_of_week"].isin([5, 6]).astype(int)
    df["month"] = df["datetime"].dt.month

    # Cyclical encoding
    df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24)

    # Initialize lag and rolling columns
    for lag in [1, 15, 60, 1440]:
        df[f"lag_{lag}"] = np.nan
    df["rolling_mean_60"] = np.nan
    df["rolling_std_60"] = np.nan

    # If recent usage available, compute lag/rolling features
    if recent_usage_df is not None:
        recent_usage_df = recent_usage_df.sort_values("datetime").reset_index(drop=True)
        combined_usage = pd.concat([recent_usage_df, df[["datetime"]]], ignore_index=True)

        for lag in [1, 15, 60, 1440]:
            df[f"lag_{lag}"] = combined_usage["Usage (kW)"].shift(lag).iloc[-len(df):].values

        rolling_window = 60
        rolling_mean = combined_usage["Usage (kW)"].shift(1).rolling(rolling_window).mean()
        rolling_std = combined_usage["Usage (kW)"].shift(1).rolling(rolling_window).std()
        df["rolling_mean_60"] = rolling_mean.iloc[-len(df):].values
        df["rolling_std_60"] = rolling_std.iloc[-len(df):].values

    return df


def predict_usage(house_id: int, future_features: pd.DataFrame) -> pd.Series:
    """
    Predict future energy usage using a saved LightGBM model and prepared features.
    """
    model_path = MODEL_DIR / f"house_{house_id}_lgb_model.txt"
    if not model_path.exists():
        raise FileNotFoundError(f"Model file not found: {model_path}")

    model = lgb.Booster(model_file=str(model_path))
    feature_cols = [col for col in future_features.columns if col not in ["datetime", "Usage (kW)"]]
    X = future_features[feature_cols]
    preds = model.predict(X)
    return pd.Series(preds, index=future_features.index)


def save_forecast_only(future_features: pd.DataFrame, predictions: pd.Series, filepath: str):
    """
    Save only datetime and predicted usage to CSV.
    """
    result_df = pd.DataFrame({
        "datetime": future_features["datetime"].dt.strftime("%Y-%m-%d %H:%M:%S"),
        "predicted_usage": predictions.values
    })

    # Ensure folder exists
    Path(filepath).parent.mkdir(parents=True, exist_ok=True)

    result_df.to_csv(filepath, index=False)
    print(f"Saved forecast results to {filepath}")


def plot_forecast_only(df: pd.DataFrame, save_path: str = None):
    """
    Plot only predicted usage over time. Optionally save as HTML.
    """
    import plotly.graph_objects as go

    if not pd.api.types.is_datetime64_any_dtype(df["datetime"]):
        df["datetime"] = pd.to_datetime(df["datetime"])

    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=df["datetime"],
        y=df["predicted_usage"],
        mode='lines+markers',
        name='Predicted Usage (kW)'
    ))

    fig.update_layout(
        title="Predicted Energy Usage",
        xaxis_title="Datetime",
        yaxis_title="Energy Usage (kW)",
        legend=dict(x=0, y=1.1, orientation="h"),
        margin=dict(l=50, r=50, t=50, b=50)
    )

    if save_path:
        Path(save_path).parent.mkdir(parents=True, exist_ok=True)
        fig.write_html(save_path)
        print(f"Forecast plot saved at {save_path}")
    else:
        fig.show()


def get_open_meteo_forecast(lat: float, lon: float) -> pd.DataFrame:
    """Fetches a 7-day hourly forecast from Open-Meteo (No API key required)."""
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": "temperature_2m,relative_humidity_2m,wind_speed_10m",
        "timezone": "auto",
        "forecast_days": 7
    }
    
    response = requests.get(url, params=params)
    response.raise_for_status()
    data = response.json()
    
    # Extract the hourly data
    hourly = data["hourly"]
    df = pd.DataFrame({
        "datetime": pd.to_datetime(hourly["time"]),
        "Temperature": hourly["temperature_2m"],
        "Humidity": hourly["relative_humidity_2m"],
        "Wind Speed": hourly["wind_speed_10m"]
    })
    return df
def save_daily_weather_report(weather_forecast_df: pd.DataFrame, filepath: str):
    """
    Summarizes hourly weather into daily averages and saves to a separate CSV.
   
    """
    # Ensure datetime is the index for resampling
    df_daily = weather_forecast_df.copy()
    df_daily.set_index("datetime", inplace=True)
    
    # Resample to 'D' (Day) and calculate the mean for each day
    daily_summary = df_daily.resample('D').mean().reset_index()
    
    # Format the date to show only YYYY-MM-DD
    daily_summary["datetime"] = daily_summary["datetime"].dt.strftime("%Y-%m-%d")
    
    # Round values for cleaner CSV output
    daily_summary = daily_summary.round(2)

    # Save to a separate file
    Path(filepath).parent.mkdir(parents=True, exist_ok=True)
    daily_summary.to_csv(filepath, index=False)
    print(f"☀️ Daily weather report (7 days) saved to: {filepath}")

if __name__ == "__main__":
    # Karachi Coordinates
    CITY = os.getenv("CITY_NAME", "Karachi")
    LAT = float(os.getenv("HOUSE_LAT", 24.8607))
    LON = float(os.getenv("HOUSE_LON", 67.0011))
    
    # 1. Fetch real weather data
    print("Fetching live weather from Open-Meteo...")
    weather_forecast_df = get_open_meteo_forecast(LAT, LON)
    
    # 2. Prepare features (Time, Cyclical, etc.)
    future_features = prepare_future_features(weather_forecast_df)
    
    # 3. Predict usage using your loaded model
    HOUSE_ID = 31
    predicted_usage = predict_usage(HOUSE_ID, future_features)
    
    print(f"Successfully generated 7-day forecast for House {HOUSE_ID}!")
    print(predicted_usage.head())

    save_path = OUTPUT_DIR / "prediction_results.csv"
    save_forecast_only(future_features, predicted_usage, save_path)

    df_results = pd.read_csv(save_path)
    df_results["datetime"] = pd.to_datetime(df_results["datetime"])

    # Plot forecast only
    plot_forecast_only(df_results, save_path=OUTPUT_DIR / "forecast_plot.html")

    weather_report_path = OUTPUT_DIR / "daily_weather_forecast_7days.csv"
    save_daily_weather_report(weather_forecast_df, weather_report_path)