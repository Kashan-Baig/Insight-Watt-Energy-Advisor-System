# Insight-Watt API - Postman Testing Guide

## Base URL
```
http://localhost:8000
```

## API Documentation
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## Workflow Overview

The Insight-Watt API uses a LangGraph workflow with the following nodes:

```
                   ┌─→ user_context_agent ─────────────────────────────────────┐
                   │                                                            │
START ─────────────┼─→ merge_csv_weather ─┬─→ consumption_insight_agent ───────┤
                   │                      │                                     │
                   │                      └─→ model_forecasted ─┬─→ forecast_insight ─┤
                   │                                            │               │
                   └─→ weather_forecasted ──────────────────────┴─→ energy_risk_agent ─┴─→ energy_advisor_agent → END
```

**LLM Provider**: Groq (model: `openai/gpt-oss-120b`)

---

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API info |
| `GET` | `/health` | Health check |
| `POST` | `/api/v1/upload` | Upload CSV file |
| `POST` | `/api/v1/analyze` | Run energy analysis workflow |
| `GET` | `/api/v1/results/{analysis_id}` | Get complete analysis results |
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

Submit questionnaire answers and run the complete LangGraph workflow.

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

> ⏱️ **Note:** This endpoint runs synchronously. It may take 1-3 minutes for the complete LangGraph workflow to complete (model training + LLM calls).

---

### 4. Get Analysis Results

Retrieve the complete analysis results including forecast insights.

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
    "created_at": "2024-12-27T15:30:00.000000",
    
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
                "date": "2024-12-28",
                "total_usage_kw": 45.2,
                "reasons": ["High temperature", "Weekend usage"],
                "severity": "high"
            }
        ],
        "summary": "Identified 2 days with potential energy spikes due to weather conditions."
    },
    
    "forecast_analysis": {
        "forecast_summary": "The 7-day forecast predicts about 176 kWh of electricity use, with a clear weekday-heavy pattern. Daily totals rise from weekend (~24.7 kWh) to weekdays.",
        "forecast_insights": [
            "Insight 1: Morning peaks are evident each day, especially between 02:00 and 05:00",
            "Insight 2: Weekend days show slightly lower average usage and a flatter load curve",
            "Insight 3: Evening consumption climbs again after 18:00, indicating cooking, lighting activities",
            "Insight 4: Temperature correlation is minimal - consumption appears weather-neutral",
            "Insight 5: Shifting high-power activities to 10:00-16:00 could reduce peak demand"
        ],
        "daily_breakdown": {
            "highest_day": "Tuesday",
            "lowest_day": "Sunday",
            "pattern_type": "weekday-heavy"
        }
    },
    
    "seven_day_energy_plan": {
        "summary": "Your home has medium occupancy with high likelihood of daytime electricity use. Based on your consumption patterns, here are personalized recommendations...",
        "estimated_savings_percent": 7,
        "comfort_impact": "low",
        "7_day_plan": {
            "Day 1": [
                {"action": "Pre-cool home before peak hours", "reason": "Reduce AC load during expensive periods"}
            ],
            "Day 2": [
                {"action": "Shift laundry to off-peak hours (10:00-16:00)", "reason": "Lower demand charges"}
            ],
            "Day 3": [
                {"action": "Adjust geyser timer to heat water during midday", "reason": "Utilize lower-cost periods"}
            ]
        }
    },
    
    "forecast_data": [
        {"datetime": "2024-12-27 00:00:00", "predicted_usage": 1.23},
        {"datetime": "2024-12-27 01:00:00", "predicted_usage": 1.45},
        {"datetime": "2024-12-27 02:00:00", "predicted_usage": 1.67},
        ...
    ]
}
```

---

## Frontend Integration Guide

### Response Fields for Display

| Field | Display Location | Description |
|-------|-----------------|-------------|
| `forecast_data` | Graph/Chart | 168 hourly data points for visualization |
| `forecast_analysis.forecast_summary` | Below graph | LLM-generated summary explaining the chart |
| `forecast_analysis.forecast_insights` | Insights section | 5 key patterns/observations |
| `consumption_insights` | Insights section | Historical usage patterns |
| `user_profile` | User profile card | Questionnaire-derived profile |
| `risk_report` | Risk section | High-risk days and warnings |
| `seven_day_energy_plan` | Action plan section | Day-by-day recommendations |

### Example Frontend Layout

```
┌─────────────────────────────────────────────────────────────┐
│                   7-Day Energy Forecast                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                                                       │  │
│  │            [LINE CHART: forecast_data]                │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  📊 Forecast Summary:                                        │
│  "{forecast_analysis.forecast_summary}"                      │
├─────────────────────────────────────────────────────────────┤
│  🔍 Key Insights:                                           │
│  • {forecast_analysis.forecast_insights[0]}                  │
│  • {forecast_analysis.forecast_insights[1]}                  │
│  • {forecast_analysis.forecast_insights[2]}                  │
├─────────────────────────────────────────────────────────────┤
│  👤 User Profile          │  ⚡ Consumption Patterns        │
│  Occupancy: medium        │  Peak Hours: 0-5, 23            │
│  HVAC: active             │  Weather Impact: neutral        │
├─────────────────────────────────────────────────────────────┤
│  ⚠️ Risk Report                                             │
│  2 high-risk days identified                                │
├─────────────────────────────────────────────────────────────┤
│  📅 7-Day Energy Plan                                        │
│  Estimated Savings: 7% | Comfort Impact: Low                │
│                                                              │
│  Day 1: Pre-cool home before peak hours                     │
│  Day 2: Shift laundry to off-peak hours                     │
│  ...                                                         │
└─────────────────────────────────────────────────────────────┘
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

## Environment Variables Required

```bash
# Required for LLM calls
GROQ_API_KEY=your-groq-api-key
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

The server will start at `http://localhost:8000` with auto-reload enabled.

---

## Sample CSV Files

Use any of the house CSV files in: `data/raw/houses/`
- `house_31.csv`
- `house_32.csv`
- etc.

Each file contains ~525,600 rows (1 year of minute-level data).

---

## Postman Collection Variables

Set these variables in your Postman environment:

| Variable | Value |
|----------|-------|
| `base_url` | `http://localhost:8000` |
| `session_id` | (set after upload) |
| `analysis_id` | (set after analyze) |

---

## Quick Test Workflow

1. **Upload CSV** → Save `session_id`
2. **Run Analyze** with `session_id` → Save `analysis_id` (wait ~1-3 min)
3. **Get Results** with `analysis_id` → View complete analysis

---

## cURL Examples

### Upload CSV
```bash
curl -X POST "http://localhost:8000/api/v1/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@path/to/house_31.csv"
```

### Run Analysis
```bash
curl -X POST "http://localhost:8000/api/v1/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "YOUR_SESSION_ID",
    "answers": {
      "q1": "3-4",
      "q2": "Mostly occupied",
      "q3": "Yes",
      "q3_1": "22-24",
      "q4": "Electric geyser",
      "q5": "2-3"
    }
  }'
```

### Get Results
```bash
curl "http://localhost:8000/api/v1/results/YOUR_ANALYSIS_ID"
```
