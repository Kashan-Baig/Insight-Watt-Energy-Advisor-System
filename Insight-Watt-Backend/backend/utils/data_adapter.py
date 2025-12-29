import pandas as pd

def extract_agent_consumption_df(
    csv_path: str | None = None,
    df: pd.DataFrame | None = None
) -> pd.DataFrame:
    """
    Extract minimal agent-ready consumption dataframe.

    Input:
    - csv_path (optional): path to CSV with engineered features
    - df (optional): pandas DataFrame with engineered features

    Required input columns:
    - datetime
    - Usage (kW)
    - Temperature
    - Humidity
    - Wind Speed

    Output columns:
    - datetime
    - use_at_kw
    - Temperature
    - Humidity
    - Wind Speed
    """

    if csv_path is None and df is None:
        raise ValueError("Either csv_path or df must be provided")

    if csv_path:
        df = pd.read_csv(csv_path)

    df = df.copy()

    # -----------------------------
    # Column Validation
    # -----------------------------
    required_cols = {
        "datetime",
        "Usage (kW)",
        "Temperature",
        "Humidity",
        "Wind Speed"
    }

    missing = required_cols - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    # -----------------------------
    # Standardize Schema for Agents
    # -----------------------------
    df["datetime"] = pd.to_datetime(df["datetime"])

    df.rename(
        columns={"Usage (kW)": "use_at_kw"},
        inplace=True
    )

    agent_df = df[
        [
            "datetime",
            "use_at_kw",
            "Temperature",
            "Humidity",
            "Wind Speed"
        ]
    ].sort_values("datetime")

    return agent_df.reset_index(drop=True)
