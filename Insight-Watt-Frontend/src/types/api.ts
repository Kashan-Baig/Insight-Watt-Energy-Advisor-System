/**
 * API Types - TypeScript interfaces matching FastAPI backend schemas
 */

// ==============================
// Upload Endpoint Types
// ==============================

export interface UploadResponse {
  session_id: string;
  file_path: string;
  rows_count: number;
  message: string;
}

// ==============================
// Analyze Endpoint Types
// ==============================

export interface QuestionnaireAnswers {
  q1: string;  // Occupancy: "1-2", "3-4", or "5+"
  q2: string;  // Daytime occupancy: "Mostly empty", "Partially occupied", "Mostly occupied"
  q3: string;  // HVAC usage: "Yes" or "No"
  q3_1?: string;  // Thermal comfort setpoint: "18-20", "20-22", "22-24", "24-26" (if q3 = "Yes")
  q4: string;  // Water heating: "Electric geyser", "Gas geyser", "Solar", "None"
  q5: string;  // Heavy appliances count: "0-1", "2-3", "4+"
}

export interface AnalyzeRequest {
  session_id: string;
  answers: QuestionnaireAnswers;
}

export interface AnalyzeResponse {
  analysis_id: string;
  status: string;
  message: string;
}

// ==============================
// Results Endpoint Types
// ==============================

export interface ForecastDataPoint {
  datetime: string;
  predicted_usage: number;
}

export interface ForecastData {
  data_points: ForecastDataPoint[];
  total_predicted_kwh: number;
  avg_daily_kwh: number;
}

export interface RiskDay {
  date: string;
  total_usage_kw: number;
  reasons: string[];
  severity: string;
}

export interface RiskReport {
  total_risk_days: number;
  risk_details: RiskDay[];
  summary: string;
}

export interface DayPlanAction {
  action: string;
  reason: string;
}

export interface SevenDayPlan {
  summary: string;
  estimated_savings_percent: number;
  comfort_impact: string;
  daily_plan?: Record<string, DayPlanAction[]>;  // Optional for compatibility
  "7_day_plan"?: Record<string, DayPlanAction[]>;  // Backend uses this key
}

export interface UserProfile {
  occupancy_density: string;
  daytime_load_probability: number;
  hvac_usage: string;
  thermal_comfort_setpoint?: string;
  water_heating_source: string;
  appliance_load_tier: string;
}

export interface ConsumptionInsights {
  usage_behavior: {
    peak_hours: number[];
    peak_months?: string[];
    weekend_behavior?: string;
    weekend_increase_percent?: number;
    avg_hourly_kw?: number;
  };
  spike_profile: {
    spike_rate_percent?: number;
    spike_count?: number;
    avg_spike_kw?: number;
    max_spike_kw?: number;
    spike_peak_hours?: number[];
    weekend_spike_percent?: number;
  };
  weather_context: {
    avg_temp_c?: number;
    thermal_condition?: string;
    humidity_level?: string;
    wind_cooling_effect?: string;
    heat_stress_index?: number;
    temp_kwh_correlation?: number;
    temp_correlation?: number;
    weather_driver: string;
  };
}

export interface ForecastAnalysis {
  forecast_summary: string;
  forecast_insights: string[];
  daily_breakdown?: {
    highest_day?: string;
    lowest_day?: string;
    pattern_type?: string;
  };
}

export interface AnalysisResult {
  analysis_id: string;
  created_at: string;
  user_profile: UserProfile;
  consumption_insights: ConsumptionInsights;
  risk_report: RiskReport;
  forecast_analysis?: ForecastAnalysis;
  seven_day_energy_plan: SevenDayPlan;
  forecast_data: ForecastDataPoint[];
}

// ==============================
// Error Types
// ==============================

export interface ErrorResponse {
  error: string;
  detail: string;
  status_code: number;
}

// ==============================
// API Response Wrappers
// ==============================

export interface SessionsListResponse {
  sessions: string[];
  count: number;
}

export interface AnalysesListResponse {
  analyses: string[];
  count: number;
}

export interface HealthCheckResponse {
  status: string;
}
