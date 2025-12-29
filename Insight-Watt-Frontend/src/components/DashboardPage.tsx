import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChartCard } from '@/components/ChartCard';
import { DayPlanCard } from '@/components/DayPlanCard';
import { ProfileCard } from '@/components/ProfileCard';
import { RiskReportCard } from '@/components/RiskReportCard';
import { ConsumptionInsightsCard } from '@/components/ConsumptionInsightsCard';
import { ForecastAnalysisCard } from '@/components/ForecastAnalysisCard';
import { ChatInterface } from '@/components/ChatInterface';
import { ChatMessage } from '@/types';
import { useAnalysisResults } from '@/hooks/useApi';
import { sendChatMessage, ChatMessage as GroqChatMessage, AnalysisContext } from '@/services/groq';
import {
  mockChatHistory,
} from '@/data/mockData';
import {
  Zap,
  BarChart3,
  Sparkles,
  CalendarDays,
  MessageCircle,
  Home,
  ChevronRight,
  Loader2,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnalysisResult, ForecastDataPoint, UserProfile, ConsumptionInsights, RiskReport, DayPlanAction, ForecastAnalysis } from '@/types/api';

type Tab = 'overview' | 'forecast' | 'plan' | 'chat';

interface DashboardPageProps {
  onBackToLanding: () => void;
  analysisId: string | null;
}

interface DayPlan {
  dayLabel: string;  // "Day 1", "Day 2", etc.
  date: string;
  actions: DayPlanAction[];
  completed?: boolean;
  skipped?: boolean;
}

// Default mock data for demo mode
const mockUserProfile: UserProfile = {
  occupancy_density: 'medium',
  daytime_load_probability: 0.7,
  hvac_usage: 'moderate',
  thermal_comfort_setpoint: '22-24',
  water_heating_source: 'electric geyser',
  appliance_load_tier: 'moderate',
};

const mockConsumptionInsights: ConsumptionInsights = {
  usage_behavior: {
    peak_hours: [18, 19, 20, 21, 22],
    peak_months: ['June', 'July', 'August'],
    weekend_behavior: 'higher',
    weekend_increase_percent: 15,
  },
  spike_profile: {
    spike_rate_percent: 8.5,
    avg_spike_kw: 3.2,
    spike_peak_hours: [19, 20, 21],
    weekend_spike_percent: 25,
  },
  weather_context: {
    avg_temp_c: 28.5,
    thermal_condition: 'warm',
    humidity_level: 'moderate',
    wind_cooling_effect: 'moderate',
    heat_stress_index: 32,
    temp_kwh_correlation: 0.4,
    weather_driver: 'weather-neutral',
  },
};

const mockRiskReport: RiskReport = {
  total_risk_days: 0,
  risk_details: [],
  summary: 'No high-risk days detected for the upcoming week.',
};

function mapApiToPlan(data: AnalysisResult): DayPlan[] {
  const { seven_day_energy_plan } = data;
  
  // Check for 7_day_plan or daily_plan
  const dailyPlan = seven_day_energy_plan["7_day_plan"] || seven_day_energy_plan.daily_plan;
  
  if (!dailyPlan) {
    return [];
  }

  const plan: DayPlan[] = [];
  const today = new Date();

  Object.entries(dailyPlan).forEach(([dayKey, actions], index) => {
    if (actions && actions.length > 0) {
      const date = new Date(today);
      date.setDate(date.getDate() + index);
      
      plan.push({
        dayLabel: dayKey,
        date: date.toISOString().split('T')[0],
        actions: actions,
      });
    }
  });

  return plan;
}

export function DashboardPage({ onBackToLanding, analysisId }: DashboardPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(mockChatHistory);
  const [isTyping, setIsTyping] = useState(false);
  const [completedDays, setCompletedDays] = useState<Record<string, boolean>>({});
  const [skippedDays, setSkippedDays] = useState<Record<string, boolean>>({});

  // Fetch analysis results if we have an analysisId
  const { data: analysisData, isLoading, error } = useAnalysisResults(analysisId);

  // Extract data from API or use mock data
  const { userProfile, consumptionInsights, riskReport, plan, forecastData, sevenDayPlan, forecastAnalysis } = useMemo(() => {
    if (!analysisData) {
      return {
        userProfile: mockUserProfile,
        consumptionInsights: mockConsumptionInsights,
        riskReport: mockRiskReport,
        plan: [] as DayPlan[],
        forecastData: [] as ForecastDataPoint[],
        sevenDayPlan: null,
        forecastAnalysis: null as ForecastAnalysis | null,
      };
    }

    return {
      userProfile: analysisData.user_profile,
      consumptionInsights: analysisData.consumption_insights,
      riskReport: analysisData.risk_report,
      plan: mapApiToPlan(analysisData),
      forecastData: analysisData.forecast_data,
      sevenDayPlan: analysisData.seven_day_energy_plan,
      forecastAnalysis: analysisData.forecast_analysis || null,
    };
  }, [analysisData]);

  // Build context for AI chatbot
  const chatContext: AnalysisContext = useMemo(() => ({
    userProfile: userProfile || null,
    consumptionInsights: consumptionInsights || null,
    riskReport: riskReport || null,
    sevenDayPlan: sevenDayPlan || null,
    forecastAnalysis: forecastAnalysis || null,
  }), [userProfile, consumptionInsights, riskReport, sevenDayPlan, forecastAnalysis]);

  // Conversation history for context (excluding system messages)
  const [conversationHistory, setConversationHistory] = useState<GroqChatMessage[]>([]);

  const handleSendMessage = async (message: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Call Groq AI
      const aiResponseContent = await sendChatMessage(
        message,
        conversationHistory,
        chatContext
      );

      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponseContent,
        timestamp: new Date(),
      };

      // Update conversation history for context
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: message },
        { role: 'assistant', content: aiResponseContent },
      ]);

      setChatMessages(prev => [...prev, aiResponse]);
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message || 'Unable to connect to AI service'}. Please try again.`,
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handlePlanComplete = (dayLabel: string) => {
    setCompletedDays(prev => ({ ...prev, [dayLabel]: true }));
  };

  const handlePlanSkip = (dayLabel: string) => {
    setSkippedDays(prev => ({ ...prev, [dayLabel]: true }));
  };

  const tabs = [
    { id: 'overview' as Tab, label: 'Overview', icon: BarChart3 },
    { id: 'forecast' as Tab, label: 'Risk', icon: AlertTriangle },
    { id: 'plan' as Tab, label: '7-Day Plan', icon: CalendarDays },
    { id: 'chat' as Tab, label: 'AI Coach', icon: MessageCircle },
  ];

  const savingsPercent = sevenDayPlan?.estimated_savings_percent || 10;

  // Loading state
  if (isLoading && analysisId) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
        <div className="fixed inset-0 gradient-mesh pointer-events-none opacity-50" />
        <Card variant="elevated" className="glass border-border/30 p-8 max-w-md">
          <CardContent className="flex flex-col items-center text-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <h2 className="font-display text-xl font-semibold mb-2">Loading Your Analysis</h2>
            <p className="text-muted-foreground">Fetching your energy insights...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error && analysisId) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
        <div className="fixed inset-0 gradient-mesh pointer-events-none opacity-50" />
        <Card variant="elevated" className="glass border-border/30 p-8 max-w-md">
          <CardContent className="flex flex-col items-center text-center">
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
            <h2 className="font-display text-xl font-semibold mb-2">Error Loading Results</h2>
            <p className="text-muted-foreground mb-4">{error.message}</p>
            <Button onClick={onBackToLanding}>Back to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 gradient-mesh pointer-events-none opacity-50" />
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-20 border-b border-border/30 glass sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBackToLanding}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <Home className="w-4 h-4" />
              </button>
              <div className="h-6 w-px bg-border/50" />
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shadow-glow">
                  <Zap className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-display font-bold text-foreground">Insight Watt</span>
              </div>
              {!analysisId && (
                <span className="ml-2 px-2 py-1 text-xs bg-muted rounded-full text-muted-foreground">Demo Mode</span>
              )}
            </div>
            
            {/* Tab Navigation */}
            <nav className="hidden md:flex items-center gap-1 glass rounded-xl p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300',
                    activeTab === tab.id
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Mobile Tab Navigation */}
        <div className="md:hidden border-t border-border/30">
          <div className="flex overflow-x-auto px-4 py-2 gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                  activeTab === tab.id
                    ? 'gradient-primary text-primary-foreground shadow-glow'
                    : 'glass text-muted-foreground'
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            {/* Forecast Chart */}
            <ChartCard 
              forecastData={forecastData} 
              title={forecastData.length > 0 ? "7-Day Energy Forecast" : "Daily Energy Consumption (Demo)"} 
            />

            {/* Forecast Analysis - Below the chart */}
            {forecastAnalysis && (
              <ForecastAnalysisCard analysis={forecastAnalysis} />
            )}

            {/* Energy Profile */}
            <ProfileCard profile={userProfile} />

            {/* AI Insights - Consumption Insights */}
            <section>
              <h2 className="font-display text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary text-glow-sm" />
                AI Consumption Insights
              </h2>
              <ConsumptionInsightsCard insights={consumptionInsights} />
            </section>
          </div>
        )}

        {activeTab === 'forecast' && (
          <div className="space-y-8 animate-fade-in">
            {/* Risk Report */}
            <RiskReportCard riskReport={riskReport} />

            {/* Quick Actions */}
            <Card variant="elevated" className="glass border-border/30">
              <CardContent className="p-6">
                <h3 className="font-display font-semibold text-foreground mb-4">Take Action</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button variant="hero" onClick={() => setActiveTab('plan')} className="flex-1 gradient-primary">
                    View 7-Day Plan
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab('chat')} className="flex-1">
                    Ask AI Coach
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'plan' && (
          <div className="space-y-8 animate-fade-in">

            {/* Plan Summary */}
            {sevenDayPlan && (
              <Card variant="elevated" className="glass border-border/30">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="font-display font-semibold text-foreground mb-2">Plan Summary</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {sevenDayPlan.summary}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="text-2xl font-bold text-savings">{savingsPercent}%</div>
                      <div className="text-xs text-muted-foreground">Est. Savings</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pt-4 border-t border-border/30">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Comfort Impact:</span>
                      <span className={cn(
                        "px-2 py-0.5 text-xs rounded-full font-medium",
                        sevenDayPlan.comfort_impact === 'low' ? 'bg-savings/10 text-savings' :
                        sevenDayPlan.comfort_impact === 'medium' ? 'bg-warning/10 text-warning' :
                        'bg-destructive/10 text-destructive'
                      )}>
                        {sevenDayPlan.comfort_impact?.charAt(0).toUpperCase() + sevenDayPlan.comfort_impact?.slice(1)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Plan Cards */}
            <section>
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">Your 7-Day Energy Plan</h2>
              {plan.length > 0 ? (
                <div className="space-y-4">
                  {plan.map((day, index) => (
                    <DayPlanCard
                      key={day.dayLabel}
                      dayLabel={day.dayLabel}
                      date={day.date}
                      actions={day.actions}
                      onComplete={() => handlePlanComplete(day.dayLabel)}
                      onSkip={() => handlePlanSkip(day.dayLabel)}
                      completed={completedDays[day.dayLabel]}
                      skipped={skippedDays[day.dayLabel]}
                      delay={index * 80}
                    />
                  ))}
                </div>
              ) : (
                <Card variant="elevated" className="glass border-border/30">
                  <CardContent className="p-8 text-center">
                    <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No energy plan available. Try analyzing your data first.</p>
                  </CardContent>
                </Card>
              )}
            </section>

            {/* Feedback Note */}
            {/* <Card variant="insight" className="glass border-insight/30">
              <CardContent className="p-4">
                <p className="text-sm text-insight text-center">
                  💡 Your next plan will adapt based on your feedback. Mark actions as completed or skipped to help us improve.
                </p>
              </CardContent>
            </Card> */}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="max-w-2xl mx-auto animate-fade-in">
            <ChatInterface
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              isTyping={isTyping}
            />
          </div>
        )}
      </main>
    </div>
  );
}