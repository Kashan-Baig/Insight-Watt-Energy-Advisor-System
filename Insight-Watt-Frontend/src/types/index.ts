export interface ConsumptionData {
  date: string;
  hour?: number;
  kWh: number;
  isPeak?: boolean;
}

export interface Insight {
  id: string;
  icon: string;
  title: string;
  description: string;
  type: 'warning' | 'insight' | 'savings';
  value?: string;
}

export interface PlanDay {
  day: string;
  date: string;
  action: string;
  reason: string;
  estimatedSaving: number;
  completed?: boolean;
  skipped?: boolean;
}

export interface BillForecast {
  predictedAmount: number;
  confidence: number;
  previousAmount?: number;
  percentageChange?: number;
  breakdown?: {
    category: string;
    amount: number;
    percentage: number;
  }[];
}

export interface EnergyProfile {
  type: string;
  description: string;
  characteristics: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface OnboardingData {
  homeType: 'apartment' | 'house' | null;
  acUsage: 'low' | 'medium' | 'high' | null;
  workingHours: string | null;
  energyGoal: 'save-money' | 'reduce-peak' | null;
  comfortPriority: 'low' | 'medium' | 'high' | null;
}

export interface AppState {
  step: 'landing' | 'upload' | 'onboarding' | 'dashboard';
  consumptionData: ConsumptionData[];
  onboardingData: OnboardingData;
  isAnalyzing: boolean;
}
