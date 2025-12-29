# backend/models/schemas.py
"""
Pydantic schemas for API request/response validation.
"""

from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from datetime import datetime


# ==============================
# Upload Endpoint Schemas
# ==============================

class UploadResponse(BaseModel):
    """Response after successful CSV upload."""
    session_id: str = Field(..., description="Unique session identifier")
    file_path: str = Field(..., description="Path to uploaded file")
    rows_count: int = Field(..., description="Number of rows in CSV")
    message: str = Field(default="File uploaded successfully")


# ==============================
# Analyze Endpoint Schemas
# ==============================

class QuestionnaireAnswers(BaseModel):
    """User questionnaire answers (5 questions)."""
    q1: str = Field(..., description="Occupancy: 1-2, 3-4, or 5+")
    q2: str = Field(..., description="Daytime occupancy: Mostly empty, Partially occupied, Mostly occupied")
    q3: str = Field(..., description="HVAC usage: Yes or No")
    q3_1: Optional[str] = Field(None, description="Thermal comfort setpoint: 18-20, 20-22, 22-24, 24-26")
    q4: str = Field(..., description="Water heating: Electric geyser, Gas geyser, Solar, None")
    q5: str = Field(..., description="Heavy appliances count: 0-1, 2-3, 4+")


class AnalyzeRequest(BaseModel):
    """Request body for /analyze endpoint."""
    session_id: str = Field(..., description="Session ID from upload")
    answers: QuestionnaireAnswers = Field(..., description="Questionnaire responses")


class AnalyzeResponse(BaseModel):
    """Response after triggering analysis."""
    analysis_id: str = Field(..., description="Unique analysis identifier")
    status: str = Field(default="completed")
    message: str = Field(default="Analysis completed successfully")


# ==============================
# Results Endpoint Schemas
# ==============================

class ForecastDataPoint(BaseModel):
    """Single forecast data point for graph."""
    datetime: str
    predicted_usage: float


class ForecastData(BaseModel):
    """7-day forecast data for visualization."""
    data_points: List[ForecastDataPoint]
    total_predicted_kwh: float
    avg_daily_kwh: float


class RiskDay(BaseModel):
    """High-risk day details."""
    date: str
    total_usage_kw: float
    reasons: List[str]
    severity: str


class RiskReport(BaseModel):
    """Energy risk assessment report."""
    total_risk_days: int
    risk_details: List[RiskDay]
    summary: str


class DayPlanAction(BaseModel):
    """Single action in daily plan."""
    action: str
    reason: str


class SevenDayPlan(BaseModel):
    """Complete 7-day energy saving plan."""
    summary: str
    estimated_savings_percent: float
    comfort_impact: str
    daily_plan: Dict[str, List[DayPlanAction]] = Field(
        ..., 
        description="Day-by-day actions, keyed as 'Day 1', 'Day 2', etc."
    )


class ForecastAnalysis(BaseModel):
    """LLM-generated forecast analysis for frontend display."""
    forecast_summary: str = Field(..., description="Summary explaining the forecast graph")
    forecast_insights: List[str] = Field(..., description="Key patterns and insights")
    daily_breakdown: Optional[Dict[str, str]] = Field(None, description="Daily pattern analysis")


class AnalysisResult(BaseModel):
    """Complete analysis result for frontend display."""
    analysis_id: str
    created_at: str
    
    # User Profile (from Agent 1)
    user_profile: Dict[str, Any]
    
    # Consumption Insights (from Agent 2)
    consumption_insights: Dict[str, Any]
    
    # Risk Report (from Agent 3)
    risk_report: Dict[str, Any]
    
    # Forecast Analysis (LLM summary and insights)
    forecast_analysis: Optional[Dict[str, Any]] = Field(
        None, 
        description="LLM-generated forecast summary and insights for frontend"
    )
    
    # 7-Day Energy Plan (from Agent 4)
    seven_day_energy_plan: Dict[str, Any]
    
    # Forecast data for graph visualization
    forecast_data: List[ForecastDataPoint]


# ==============================
# Error Schemas
# ==============================

class ErrorResponse(BaseModel):
    """Standard error response."""
    error: str
    detail: str
    status_code: int
