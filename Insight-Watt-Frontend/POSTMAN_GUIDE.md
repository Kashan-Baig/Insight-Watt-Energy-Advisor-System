# Insight-Watt API - Postman Testing Guide

## Base URL
```
http://localhost:8000
```

## API Documentation
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API info |
| `GET` | `/health` | Health check |
| `POST` | `/api/v1/upload` | Upload CSV file |
| `POST` | `/api/v1/analyze` | Run energy analysis |
| `GET` | `/api/v1/results/{analysis_id}` | Get analysis results |
| `GET` | `/api/v1/sessions` | List sessions (debug) |
| `GET` | `/api/v1/analyses` | List analyses (debug) |

---

## Step-by-Step Testing

### 1. Health Check

Verify the API is running.

```
GET http://localhost:8000/health
```

**Expected Response:**
```json
{
    "status": "healthy"
}
```

---

### 2. Upload CSV File

Upload an energy consumption CSV file.

```
POST http://localhost:8000/api/v1/upload
```

**Headers:**
```
Content-Type: multipart/form-data
```

**Body (form-data):**
| Key | Type | Value |
|-----|------|-------|
| `file` | File | Select your CSV file |

**Sample CSV Format:**
```csv
datetime,Usage (kW)
2024-01-01 00:00:00,1.23
2024-01-01 00:01:00,1.45
...
```

**Expected Response:**
```json
{
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "file_path": "C:\\...\\data\\uploads\\550e8400-e29b-41d4-a716-446655440000.csv",
    "rows_count": 525600,
    "message": "File uploaded successfully"
}
```

> ⚠️ **Save the `session_id`** - You'll need it for the analyze step!

---

### 3. Run Energy Analysis

Submit questionnaire answers and run the LangGraph workflow.

```
POST http://localhost:8000/api/v1/analyze
```

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "answers": {
        "q1": "3-4",
        "q2": "Mostly occupied",
        "q3": "Yes",
        "q3_1": "22-24",
        "q4": "Electric geyser",
        "q5": "2-3"
    }
}
```

**Questionnaire Options:**

| Question | Description | Options |
|----------|-------------|---------|
| `q1` | Occupancy | `"1-2"`, `"3-4"`, `"5+"` |
| `q2` | Daytime occupancy | `"Mostly empty"`, `"Partially occupied"`, `"Mostly occupied"` |
| `q3` | HVAC usage | `"Yes"`, `"No"` |
| `q3_1` | Thermal comfort (if q3=Yes) | `"18-20"`, `"20-22"`, `"22-24"`, `"24-26"` |
| `q4` | Water heating | `"Electric geyser"`, `"Gas geyser"`, `"Solar"`, `"None"` |
| `q5` | Heavy appliances | `"0-1"`, `"2-3"`, `"4+"` |

**Expected Response:**
```json
{
    "analysis_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "status": "completed",
    "message": "Analysis completed successfully"
}
```

> ⚠️ **Save the `analysis_id`** - You'll need it to retrieve results!

> ⏱️ **Note:** This endpoint runs synchronously. It may take 1-2 minutes for the LangGraph workflow to complete.

---

### 4. Get Analysis Results

Retrieve the complete analysis results.

```
GET http://localhost:8000/api/v1/results/{analysis_id}
```

**Example:**
```
GET http://localhost:8000/api/v1/results/7c9e6679-7425-40de-944b-e07fc1f90ae7
```

**Expected Response:**
```json
{
    "analysis_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "created_at": "2024-12-27T00:00:00.000000",
    
    "user_profile": {
        "occupancy_density": "medium",
        "daytime_load_probability": 0.9,
        "hvac_usage": "active",
        "thermal_comfort_setpoint": "22-24",
        "water_heating_source": "electric geyser",
        "appliance_load_tier": "moderate"
    },
    
    "consumption_insights": {
        "usage_behavior": {
            "peak_hours": [0, 1, 2, 3, 4, 5, 23],
            "avg_hourly_kw": 0.95
        },
        "spike_profile": {
            "spike_count": 5,
            "max_spike_kw": 3.2
        },
        "weather_context": {
            "weather_driver": "weather-neutral",
            "temp_correlation": 0.12
        }
    },
    
    "risk_report": {
        "total_risk_days": 2,
        "risk_details": [
            {
                "date": "2024-01-03",
                "total_usage_kw": 45.2,
                "reasons": ["High temperature", "Weekend usage"],
                "severity": "high"
            }
        ],
        "summary": "Identified 2 days with potential energy spikes."
    },
    
    "seven_day_energy_plan": {
        "summary": "Based on your profile...",
        "estimated_savings_percent": 10,
        "comfort_impact": "low",
        "daily_plan": {
            "Day 1": [
                {"action": "Pre-cool home before peak hours", "reason": "Reduce AC load"}
            ],
            "Day 2": [
                {"action": "Shift laundry to off-peak", "reason": "Lower demand charges"}
            ]
        }
    },
    
    "forecast_data": [
        {"datetime": "2024-01-01 00:00:00", "predicted_usage": 1.23},
        {"datetime": "2024-01-01 01:00:00", "predicted_usage": 1.45},
        ...
    ]
}
```

---

## Debug Endpoints

### List All Sessions
```
GET http://localhost:8000/api/v1/sessions
```

**Response:**
```json
{
    "sessions": ["550e8400-e29b-41d4-a716-446655440000"],
    "count": 1
}
```

### List All Analyses
```
GET http://localhost:8000/api/v1/analyses
```

**Response:**
```json
{
    "analyses": ["7c9e6679-7425-40de-944b-e07fc1f90ae7"],
    "count": 1
}
```

---

## Error Responses

### 400 Bad Request
```json
{
    "detail": "Only CSV files are allowed"
}
```

### 404 Not Found
```json
{
    "detail": "Session 'xxx' not found. Please upload a CSV first."
}
```

### 500 Internal Server Error
```json
{
    "detail": "Analysis failed: [error message]"
}
```

---

## Running the Server

```bash
# From project root
cd c:\Users\Zainab\Desktop\Insight-Watt-Backend

# Activate virtual environment
.venv\Scripts\activate

# Run the server
python -m backend.main
```

The server will start at `http://localhost:8000`

---

## Sample CSV Files

Use any of the house CSV files in: `data/raw/houses/`
- `house_31.csv`
- `house_32.csv`
- etc.

---

## Postman Collection Import

1. Open Postman
2. Click **Import** → **Raw Text**
3. Paste the curl commands or create requests manually
4. Save as "Insight-Watt API" collection
