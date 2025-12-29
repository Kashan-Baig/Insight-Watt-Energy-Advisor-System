/**
 * React Query hooks for Insight-Watt API
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  uploadCsv,
  runAnalysis,
  getResults,
  healthCheck,
  ApiError,
} from '@/services/api';
import type {
  UploadResponse,
  QuestionnaireAnswers,
  AnalyzeResponse,
  AnalysisResult,
} from '@/types/api';

// Query Keys
export const queryKeys = {
  health: ['health'] as const,
  results: (analysisId: string) => ['results', analysisId] as const,
  sessions: ['sessions'] as const,
  analyses: ['analyses'] as const,
};

/**
 * Hook to check API health status
 */
export function useHealthCheck() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: healthCheck,
    retry: false,
    refetchInterval: 30000, // Check every 30 seconds
  });
}

/**
 * Hook for uploading CSV files
 */
export function useUploadCsv() {
  const queryClient = useQueryClient();

  return useMutation<UploadResponse, ApiError, File>({
    mutationFn: uploadCsv,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
    },
  });
}

/**
 * Hook for running energy analysis
 */
export function useRunAnalysis() {
  const queryClient = useQueryClient();

  return useMutation<
    AnalyzeResponse,
    ApiError,
    { sessionId: string; answers: QuestionnaireAnswers }
  >({
    mutationFn: ({ sessionId, answers }) => runAnalysis(sessionId, answers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.analyses });
    },
  });
}

/**
 * Hook for fetching analysis results
 */
export function useAnalysisResults(analysisId: string | null) {
  return useQuery<AnalysisResult, ApiError>({
    queryKey: queryKeys.results(analysisId ?? ''),
    queryFn: () => getResults(analysisId!),
    enabled: !!analysisId,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    retry: 2,
  });
}

/**
 * Combined hook for the full upload + analyze flow
 */
export function useEnergyAnalysisFlow() {
  const uploadMutation = useUploadCsv();
  const analyzeMutation = useRunAnalysis();

  const startAnalysis = async (
    file: File,
    answers: QuestionnaireAnswers
  ): Promise<{ sessionId: string; analysisId: string }> => {
    // Step 1: Upload CSV
    const uploadResult = await uploadMutation.mutateAsync(file);
    
    // Step 2: Run analysis
    const analyzeResult = await analyzeMutation.mutateAsync({
      sessionId: uploadResult.session_id,
      answers,
    });

    return {
      sessionId: uploadResult.session_id,
      analysisId: analyzeResult.analysis_id,
    };
  };

  return {
    startAnalysis,
    isUploading: uploadMutation.isPending,
    isAnalyzing: analyzeMutation.isPending,
    isLoading: uploadMutation.isPending || analyzeMutation.isPending,
    uploadError: uploadMutation.error,
    analyzeError: analyzeMutation.error,
    error: uploadMutation.error || analyzeMutation.error,
    reset: () => {
      uploadMutation.reset();
      analyzeMutation.reset();
    },
  };
}
