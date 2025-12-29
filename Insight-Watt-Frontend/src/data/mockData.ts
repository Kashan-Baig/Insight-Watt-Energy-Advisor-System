import { ConsumptionData, Insight, PlanDay, BillForecast, EnergyProfile, ChatMessage } from '@/types';

// Generate realistic consumption data for the past 30 days
export const generateMockConsumptionData = (): ConsumptionData[] => {
  const data: ConsumptionData[] = [];
  const now = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Generate hourly data for each day
    for (let hour = 0; hour < 24; hour++) {
      // Base consumption varies by time of day
      let baseConsumption = 0.5;
      
      // Morning peak (6-9 AM)
      if (hour >= 6 && hour <= 9) {
        baseConsumption = 1.5 + Math.random() * 0.8;
      }
      // Daytime (10 AM - 5 PM)
      else if (hour >= 10 && hour <= 17) {
        baseConsumption = 0.8 + Math.random() * 0.5;
      }
      // Evening peak (6-10 PM)
      else if (hour >= 18 && hour <= 22) {
        baseConsumption = 2.5 + Math.random() * 1.5;
      }
      // Night (11 PM - 5 AM)
      else {
        baseConsumption = 0.3 + Math.random() * 0.3;
      }
      
      // Add some daily variation
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        baseConsumption *= 1.2; // Higher on weekends
      }
      
      data.push({
        date: dateStr,
        hour,
        kWh: parseFloat(baseConsumption.toFixed(2)),
        isPeak: hour >= 18 && hour <= 22,
      });
    }
  }
  
  return data;
};

// Aggregate daily data
export const getDailyConsumption = (data: ConsumptionData[]): ConsumptionData[] => {
  const dailyMap = new Map<string, number>();
  
  data.forEach(item => {
    const current = dailyMap.get(item.date) || 0;
    dailyMap.set(item.date, current + item.kWh);
  });
  
  return Array.from(dailyMap.entries()).map(([date, kWh]) => ({
    date,
    kWh: parseFloat(kWh.toFixed(2)),
  }));
};

export const mockInsights: Insight[] = [
  {
    id: '1',
    icon: '🔥',
    title: '72% Peak Hour Usage',
    description: 'Most of your electricity is consumed during expensive peak hours (6-10 PM)',
    type: 'warning',
    value: '72%',
  },
  {
    id: '2',
    icon: '🌙',
    title: 'High Night Idle Load',
    description: 'Your standby consumption at night is 40% higher than average households',
    type: 'insight',
    value: '+40%',
  },
  {
    id: '3',
    icon: '❄️',
    title: 'AC Dominates Usage',
    description: 'Cooling accounts for an estimated 45% of your total consumption',
    type: 'insight',
    value: '45%',
  },
  {
    id: '4',
    icon: '📈',
    title: 'Weekend Spike',
    description: 'Your weekend usage is 35% higher than weekdays',
    type: 'warning',
    value: '+35%',
  },
];

export const mockPlan: PlanDay[] = [
  {
    day: 'Monday',
    date: '2024-01-15',
    action: 'Set AC temperature to 24°C instead of 22°C from 6-10 PM',
    reason: 'Peak tariff hours - each degree saves 3-5% cooling energy',
    estimatedSaving: 180,
  },
  {
    day: 'Tuesday',
    date: '2024-01-16',
    action: 'Unplug chargers and standby devices before sleeping',
    reason: 'Your night idle load is unusually high - phantom loads add up',
    estimatedSaving: 45,
  },
  {
    day: 'Wednesday',
    date: '2024-01-17',
    action: 'Run washing machine before 6 PM',
    reason: 'Avoid peak hours for high-consumption appliances',
    estimatedSaving: 120,
  },
  {
    day: 'Thursday',
    date: '2024-01-18',
    action: 'Use natural ventilation from 7-8 AM instead of AC',
    reason: 'Morning temperatures are cooler - save AC runtime',
    estimatedSaving: 95,
  },
  {
    day: 'Friday',
    date: '2024-01-19',
    action: 'Pre-cool your home at 5 PM before peak rates begin',
    reason: 'Cooling at off-peak saves money while maintaining comfort',
    estimatedSaving: 150,
  },
  {
    day: 'Saturday',
    date: '2024-01-20',
    action: 'Batch cooking and laundry in the morning hours',
    reason: 'Weekend usage spikes - consolidate high-energy tasks early',
    estimatedSaving: 200,
  },
  {
    day: 'Sunday',
    date: '2024-01-21',
    action: 'Review and turn off unused appliances and lights',
    reason: 'Weekly audit helps identify forgotten energy drains',
    estimatedSaving: 60,
  },
];

export const mockBillForecast: BillForecast = {
  predictedAmount: 18250,
  confidence: 92,
  previousAmount: 16100,
  percentageChange: 13.4,
  breakdown: [
    { category: 'Air Conditioning', amount: 8200, percentage: 45 },
    { category: 'Lighting', amount: 2920, percentage: 16 },
    { category: 'Kitchen Appliances', amount: 3650, percentage: 20 },
    { category: 'Entertainment', amount: 1825, percentage: 10 },
    { category: 'Other', amount: 1655, percentage: 9 },
  ],
};

export const mockEnergyProfile: EnergyProfile = {
  type: 'Peak-Heavy Consumer',
  description: 'Your energy usage pattern shows heavy reliance on peak-hour electricity, particularly for cooling. This results in higher bills despite moderate overall consumption.',
  characteristics: [
    'Most electricity used during expensive peak hours (6-10 PM)',
    'AC usage is a major contributor to your bill',
    'Night-time idle load is higher than average',
    'Weekend consumption significantly exceeds weekdays',
  ],
  riskLevel: 'high',
};

export const mockChatHistory: ChatMessage[] = [
  {
    id: '1',
    role: 'assistant',
    content: "Hi! I'm your AI Energy Coach. I've analyzed your electricity data and I'm here to help you understand your usage patterns and save money. What would you like to know?",
    timestamp: new Date(),
  },
];

export const suggestedPrompts = [
  "Why is my bill so high?",
  "How can I save more this week?",
  "What's using the most energy?",
  "Best time to run appliances?",
];
