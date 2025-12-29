import os
import argparse
import pandas as pd
import numpy as np
import lightgbm as lgb
from pathlib import Path
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import plotly.express as px

# ======================
# PATHS
# ======================
HOUSE_DATA_DIR = Path("..\..\..\data/raw/houses")
WEATHER_DATA_DIR = Path("..\..\..\data/raw/weather")

PROCESSED_DIR = Path("..\..\..\data/processed")
OUTPUTS_DIR = Path("outputs")

# ======================
# LOAD HOUSE DATA
# ======================
def load_house_data(house_id: int) -> pd.DataFrame:
    file_path = HOUSE_DATA_DIR / f"house_{house_id}.csv"
    if not file_path.exists():
        raise FileNotFoundError(file_path)

    df = pd.read_csv(file_path)
    df["datetime"] = pd.to_datetime(df["datetime"], format="mixed")
    return df.sort_values("datetime").reset_index(drop=True)


# ======================
# LOAD WEATHER DATA
# ======================
def load_weather_data(city: str) -> pd.DataFrame:
    file_path = WEATHER_DATA_DIR / f"{city}.csv"
    if not file_path.exists():
        raise FileNotFoundError(file_path)

    df = pd.read_csv(file_path)
    df["datetime"] = pd.to_datetime(df["datetime"], format="mixed")

    for col in df.columns:
        if col != "datetime":
            df[col] = pd.to_numeric(df[col], errors="coerce")

    return df.sort_values("datetime").reset_index(drop=True)


# ======================
# MERGE HOUSE + WEATHER
# ======================
def merge_house_weather(house_id: int, city: str) -> pd.DataFrame:
    house_df = load_house_data(house_id)[["datetime", "Usage (kW)"]]
    weather_df = load_weather_data(city)[
        ["datetime", "Temperature", "Humidity", "Wind Speed"]
    ]

    # Expand hourly weather → minute-level
    weather_expanded = (
        weather_df
        .set_index("datetime")
        .resample("min")
        .ffill()
        .reset_index()
    )

    return pd.merge_asof(
        house_df.sort_values("datetime"),
        weather_expanded.sort_values("datetime"),
        on="datetime"
    )


# ======================
# FEATURE ENGINEERING
# ======================
def prepare_model_input(house_id: int, city: str) -> pd.DataFrame:
    df = merge_house_weather(house_id, city)

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

    # Lag & rolling features
    target = "Usage (kW)"
    df["lag_1"] = df[target].shift(1)
    df["lag_15"] = df[target].shift(15)
    df["lag_60"] = df[target].shift(60)
    df["lag_1440"] = df[target].shift(1440)

    df["rolling_mean_60"] = df[target].shift(1).rolling(60).mean()
    df["rolling_std_60"] = df[target].shift(1).rolling(60).std()

    return df.dropna().reset_index(drop=True)


# ======================
# PIPELINE FUNCTION
# ======================
def run_pipeline(house_id: int, city: str):
    print(f"🚀 Running pipeline for House {house_id} in {city}")

    df = prepare_model_input(house_id, city)

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)

    model_input_path = PROCESSED_DIR / f"house_{house_id}_model_input.csv"
    forecast_path = OUTPUTS_DIR / "forecasts" / f"house_{house_id}_forecast.csv"
    model_path = OUTPUTS_DIR / "models" / f"house_{house_id}_lgb_model.txt"

    forecast_path.parent.mkdir(parents=True, exist_ok=True)
    model_path.parent.mkdir(parents=True, exist_ok=True)

    df.to_csv(model_input_path, index=False)

    datetime_series = df["datetime"]
    target = "Usage (kW)"

    X = df.drop(columns=[target, "datetime"])
    y = df[target]

    split = int(len(df) * 0.8)
    X_train, X_val = X.iloc[:split], X.iloc[split:]
    y_train, y_val = y.iloc[:split], y.iloc[split:]
    datetime_val = datetime_series.iloc[split:]

    model = lgb.LGBMRegressor(
        n_estimators=1000,
        learning_rate=0.05,
        max_depth=8,
        random_state=42
    )

    model.fit(X_train, y_train)
    y_pred = model.predict(X_val)

    mae = mean_absolute_error(y_val, y_pred)
    mse = mean_squared_error(y_val, y_pred) ** 0.5
    r2 = r2_score(y_val, y_pred)

    print("\n📊 Model Performance")
    print(f"MAE  : {mae:.4f}")
    print(f"MSE : {mse:.4f}")
    print(f"R²   : {r2:.4f}")

    forecast_df = pd.DataFrame({
        "datetime": datetime_val,
        "actual_usage": y_val,
        "forecast_usage": y_pred
    })

    forecast_df.to_csv(forecast_path, index=False)
    model.booster_.save_model(model_path)

    fig = px.line(
        forecast_df,
        x="datetime",
        y=["actual_usage", "forecast_usage"],
        title=f"House {house_id} – Actual vs Forecast"
    )
    fig.show()

    print("🎉 Pipeline completed successfully!")


# ======================
# ENTRY POINT
# ======================
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--house_id", type=int, required=True)
    parser.add_argument("--city", type=str, required=True)
    args = parser.parse_args()

    run_pipeline(args.house_id, args.city)
