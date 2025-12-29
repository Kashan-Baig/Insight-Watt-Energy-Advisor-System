/**
 * API Service - HTTP client for Insight-Watt backend
 */

import type {
  UploadResponse,
  QuestionnaireAnswers,
  AnalyzeRequest,
  AnalyzeResponse,
  AnalysisResult,
  HealthCheckResponse,
  SessionsListResponse,
  AnalysesListResponse,
} from '@/types/api';

// Base URL for the FastAPI backend
const API_BASE_URL = 'http://localhost:8000';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(message: string, status: number, detail: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

/**
 * Generic fetch wrapper with error handling
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new ApiError(
      `API Error: ${response.status}`,
      response.status,
      errorData.detail || 'An error occurred'
    );
  }

  return response.json();
}

// ==============================
// Health Check
// ==============================

/**
 * Check if the backend API is healthy
 */
export async function healthCheck(): Promise<HealthCheckResponse> {
  return fetchApi<HealthCheckResponse>('/health');
}

// ==============================
// Upload Endpoint
// ==============================

/**
 * Upload a CSV file to the backend
 * @param file - The CSV file to upload
 * @returns Upload response with session_id
 */
export async function uploadCsv(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  return fetchApi<UploadResponse>('/api/v1/upload', {
    method: 'POST',
    body: formData,
  });
}

// ==============================
// Analyze Endpoint
// ==============================

/**
 * Run energy analysis with questionnaire answers
 * @param sessionId - Session ID from CSV upload
 * @param answers - User's questionnaire answers
 * @returns Analysis response with analysis_id
 */
export async function runAnalysis(
  sessionId: string,
  answers: QuestionnaireAnswers
): Promise<AnalyzeResponse> {
  const request: AnalyzeRequest = {
    session_id: sessionId,
    answers,
  };

  return fetchApi<AnalyzeResponse>('/api/v1/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
}

// ==============================
// Results Endpoint
// ==============================

/**
 * Get analysis results by ID
 * @param analysisId - Analysis ID from analyze endpoint
 * @returns Complete analysis result
 */
export async function getResults(analysisId: string): Promise<AnalysisResult> {
  return fetchApi<AnalysisResult>(`/api/v1/results/${analysisId}`);
}

// ==============================
// Debug Endpoints
// ==============================

/**
 * List all sessions (debug)
 */
export async function listSessions(): Promise<SessionsListResponse> {
  return fetchApi<SessionsListResponse>('/api/v1/sessions');
}

/**
 * List all analyses (debug)
 */
export async function listAnalyses(): Promise<AnalysesListResponse> {
  return fetchApi<AnalysesListResponse>('/api/v1/analyses');
}

// Export all functions
export const api = {
  healthCheck,
  uploadCsv,
  runAnalysis,
  getResults,
  listSessions,
  listAnalyses,
};

export default api;
