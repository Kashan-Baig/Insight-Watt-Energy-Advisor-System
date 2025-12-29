# backend/routes/energy.py
"""
Energy Analysis API Routes
--------------------------
Handles CSV upload, analysis triggering, and results retrieval.
"""

import os
import uuid
import shutil
from pathlib import Path
from datetime import datetime
from typing import Dict, Any

from fastapi import APIRouter, UploadFile, File, HTTPException, status
from fastapi.responses import JSONResponse
import pandas as pd

from backend.models.schemas import (
    UploadResponse,
    AnalyzeRequest,
    AnalyzeResponse,
    AnalysisResult,
    ForecastDataPoint,
    ErrorResponse,
)

# Import LangGraph workflow
from agents.main_graph import build_energy_agent_graph
from agents.agent_state import get_initial_state

router = APIRouter(prefix="/api/v1", tags=["Energy Analysis"])

# ==============================
# In-Memory Storage
# ==============================
# session_id -> file_path mapping
sessions: Dict[str, str] = {}

# analysis_id -> AnalysisResult mapping
analyses: Dict[str, Dict[str, Any]] = {}

# File upload directory
UPLOAD_DIR = Path(__file__).resolve().parents[2] / "data" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


# ==============================
# Upload Endpoint
# ==============================
@router.post(
    "/upload",
    response_model=UploadResponse,
    responses={400: {"model": ErrorResponse}},
    summary="Upload energy consumption CSV",
    description="Upload a CSV file containing energy consumption data. Returns a session_id for subsequent analysis."
)
async def upload_csv(file: UploadFile = File(...)):
    """
    Upload user's energy consumption CSV file.
    
    - Validates file is CSV
    - Saves to uploads directory
    - Returns session_id for tracking
    """
    # Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are allowed"
        )
    
    # Generate unique session ID
    session_id = str(uuid.uuid4())
    
    # Save file with session ID as filename
    file_path = UPLOAD_DIR / f"{session_id}.csv"
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )
    finally:
        file.file.close()
    
    # Validate CSV and count rows
    try:
        df = pd.read_csv(file_path)
        rows_count = len(df)
        
        # Basic validation - check for required columns
        required_cols = ["datetime"]
        missing = [col for col in required_cols if col not in df.columns]
        if missing:
            os.remove(file_path)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"CSV missing required columns: {missing}"
            )
    except pd.errors.EmptyDataError:
        os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV file is empty"
        )
    except Exception as e:
        if file_path.exists():
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid CSV file: {str(e)}"
        )
    
    # Store session
    sessions[session_id] = str(file_path)
    
    return UploadResponse(
        session_id=session_id,
        file_path=str(file_path),
        rows_count=rows_count,
        message="File uploaded successfully"
    )


# ==============================
# Analyze Endpoint
# ==============================
@router.post(
    "/analyze",
    response_model=AnalyzeResponse,
    responses={404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    summary="Run energy analysis",
    description="Submit questionnaire answers to trigger the LangGraph energy analysis workflow."
)
async def analyze_energy(request: AnalyzeRequest):
    """
    Run the complete LangGraph energy analysis workflow.
    
    - Validates session exists
    - Runs LangGraph workflow synchronously
    - Stores results for retrieval
    """
    # Validate session
    if request.session_id not in sessions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{request.session_id}' not found. Please upload a CSV first."
        )
    
    file_path = sessions[request.session_id]
    
    # Validate file still exists
    if not Path(file_path).exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Uploaded file no longer exists. Please upload again."
        )
    
    # Convert Pydantic model to dict for LangGraph
    answers = {
        "q1": request.answers.q1,
        "q2": request.answers.q2,
        "q3": request.answers.q3,
        "q3_1": request.answers.q3_1,
        "q4": request.answers.q4,
        "q5": request.answers.q5,
    }
    
    try:
        # Build and run LangGraph workflow
        print(f"🚀 Starting analysis for session: {request.session_id}")
        
        app = build_energy_agent_graph()
        initial_state = get_initial_state(
            answers=answers,
            house_csv_path=file_path
        )
        
        # Run workflow synchronously
        final_state = app.invoke(initial_state)
        
        print(f"✅ Analysis completed for session: {request.session_id}")
        
    except Exception as e:
        print(f"❌ Analysis failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )
    
    # Generate analysis ID
    analysis_id = str(uuid.uuid4())
    
    # Extract forecast data for graph
    forecast_data = []
    if "energy_forecast_df" in final_state and final_state["energy_forecast_df"] is not None:
        df_forecast = final_state["energy_forecast_df"]
        for _, row in df_forecast.iterrows():
            forecast_data.append(ForecastDataPoint(
                datetime=str(row["datetime"]),
                predicted_usage=float(row["predicted_usage"])
            ))
    
    # Store analysis result
    analyses[analysis_id] = {
        "analysis_id": analysis_id,
        "session_id": request.session_id,
        "created_at": datetime.utcnow().isoformat(),
        "user_profile": final_state.get("user_profile", {}),
        "consumption_insights": final_state.get("consumption_insights", {}),
        "risk_report": final_state.get("risk_report", {}),
        "forecast_analysis": final_state.get("forecast_analysis", {}),  # NEW: LLM forecast analysis
        "seven_day_energy_plan": final_state.get("seven_day_energy_plan", {}),
        "forecast_data": [fp.model_dump() for fp in forecast_data],
    }
    
    return AnalyzeResponse(
        analysis_id=analysis_id,
        status="completed",
        message="Analysis completed successfully"
    )


# ==============================
# Results Endpoint
# ==============================
@router.get(
    "/results/{analysis_id}",
    response_model=AnalysisResult,
    responses={404: {"model": ErrorResponse}},
    summary="Get analysis results",
    description="Retrieve complete analysis results including forecast, insights, and energy plan."
)
async def get_results(analysis_id: str):
    """
    Retrieve analysis results by ID.
    
    Returns:
    - User profile from questionnaire
    - Consumption insights from historical data
    - Energy risk assessment
    - 7-day personalized energy plan
    - Forecast data for visualization
    """
    if analysis_id not in analyses:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis '{analysis_id}' not found"
        )
    
    result = analyses[analysis_id]
    
    # Convert stored data to response model
    forecast_data = [
        ForecastDataPoint(**fp) for fp in result.get("forecast_data", [])
    ]
    
    return AnalysisResult(
        analysis_id=result["analysis_id"],
        created_at=result["created_at"],
        user_profile=result["user_profile"],
        consumption_insights=result["consumption_insights"],
        risk_report=result["risk_report"],
        forecast_analysis=result.get("forecast_analysis"),  # NEW
        seven_day_energy_plan=result["seven_day_energy_plan"],
        forecast_data=forecast_data
    )


# ==============================
# List All Sessions (Debug)
# ==============================
@router.get(
    "/sessions",
    summary="List active sessions (debug)",
    description="Returns all active upload sessions. For debugging only."
)
async def list_sessions():
    """List all active upload sessions."""
    return {
        "sessions": list(sessions.keys()),
        "count": len(sessions)
    }


# ==============================
# List All Analyses (Debug)
# ==============================
@router.get(
    "/analyses",
    summary="List all analyses (debug)",
    description="Returns all completed analyses. For debugging only."
)
async def list_analyses():
    """List all completed analyses."""
    return {
        "analyses": list(analyses.keys()),
        "count": len(analyses)
    }
