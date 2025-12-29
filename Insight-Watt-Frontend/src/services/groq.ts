/**
 * Groq AI Service - Chat with energy analysis context
 */

import type { 
  UserProfile, 
  ConsumptionInsights, 
  RiskReport, 
  SevenDayPlan, 
  ForecastAnalysis 
} from '@/types/api';

// Get API key from environment
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'openai/gpt-oss-120b';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AnalysisContext {
  userProfile: UserProfile | null;
  consumptionInsights: ConsumptionInsights | null;
  riskReport: RiskReport | null;
  sevenDayPlan: SevenDayPlan | null;
  forecastAnalysis: ForecastAnalysis | null;
}

/**
 * Build system prompt with analysis context
 */
function buildSystemPrompt(context: AnalysisContext): string {
  const { userProfile, consumptionInsights, riskReport, sevenDayPlan, forecastAnalysis } = context;

  let contextInfo = '';

  // User Profile
  if (userProfile) {
    contextInfo += `
## User's Energy Profile:
- Occupancy Density: ${userProfile.occupancy_density}
- Daytime Load Probability: ${(userProfile.daytime_load_probability * 100).toFixed(0)}%
- HVAC Usage: ${userProfile.hvac_usage}
- Thermal Comfort Setpoint: ${userProfile.thermal_comfort_setpoint || 'N/A'}
- Water Heating: ${userProfile.water_heating_source}
- Appliance Load: ${userProfile.appliance_load_tier}
`;
  }

  // Consumption Insights
  if (consumptionInsights) {
    const { usage_behavior, spike_profile, weather_context } = consumptionInsights;
    contextInfo += `
## Consumption Insights:
### Usage Behavior:
- Peak Hours: ${usage_behavior.peak_hours?.join(', ') || 'N/A'}
- Peak Months: ${usage_behavior.peak_months?.join(', ') || 'N/A'}
- Weekend Behavior: ${usage_behavior.weekend_behavior || 'N/A'}
- Weekend Change: ${usage_behavior.weekend_increase_percent?.toFixed(1) || 'N/A'}%

### Spike Profile:
- Spike Rate: ${spike_profile.spike_rate_percent?.toFixed(1) || 'N/A'}%
- Average Spike: ${spike_profile.avg_spike_kw?.toFixed(1) || 'N/A'} kW
- Weekend Spikes: ${spike_profile.weekend_spike_percent?.toFixed(1) || 'N/A'}%

### Weather Context:
- Average Temperature: ${weather_context.avg_temp_c?.toFixed(1) || 'N/A'}°C
- Thermal Condition: ${weather_context.thermal_condition || 'N/A'}
- Weather Driver: ${weather_context.weather_driver || 'N/A'}
- Temperature-Consumption Correlation: ${((weather_context.temp_kwh_correlation || 0) * 100).toFixed(0)}%
`;
  }

  // Risk Report
  if (riskReport) {
    contextInfo += `
## Risk Assessment:
- Total High-Risk Days: ${riskReport.total_risk_days}
- Summary: ${riskReport.summary}
`;
    if (riskReport.risk_details?.length > 0) {
      contextInfo += `- Risk Details:\n`;
      riskReport.risk_details.forEach(day => {
        contextInfo += `  * ${day.date}: ${day.total_usage_kw.toFixed(1)} kW (${day.severity}) - ${day.reasons.join(', ')}\n`;
      });
    }
  }

  // Seven Day Plan
  if (sevenDayPlan) {
    contextInfo += `
## 7-Day Energy Saving Plan:
- Summary: ${sevenDayPlan.summary}
- Estimated Savings: ${sevenDayPlan.estimated_savings_percent}%
- Comfort Impact: ${sevenDayPlan.comfort_impact}
`;
  }

  // Forecast Analysis
  if (forecastAnalysis) {
    contextInfo += `
## Forecast Analysis:
- Summary: ${forecastAnalysis.forecast_summary}
- Key Insights:
${forecastAnalysis.forecast_insights?.map((insight, i) => `  ${i + 1}. ${insight}`).join('\n') || 'N/A'}
`;
    if (forecastAnalysis.daily_breakdown) {
      contextInfo += `- Highest Usage Day: ${forecastAnalysis.daily_breakdown.highest_day || 'N/A'}
- Lowest Usage Day: ${forecastAnalysis.daily_breakdown.lowest_day || 'N/A'}
- Pattern Type: ${forecastAnalysis.daily_breakdown.pattern_type || 'N/A'}
`;
    }
  }

  return `You are an AI Energy Coach for Insight Watt. Help users understand and reduce their electricity consumption.

USER'S ENERGY DATA:
${contextInfo}

RESPONSE FORMAT RULES (CRITICAL - FOLLOW EXACTLY):
1. Keep responses SHORT - maximum 3-4 sentences for simple questions
2. Use bullet points (•) for lists, NOT numbered lists or tables
3. NO markdown headers (###), NO tables, NO code blocks
4. Maximum 5 bullet points per response
5. Be direct and specific - reference actual numbers from the data
6. Use simple formatting only - bold (**text**) sparingly
7. For cost estimates, use Rs. (Pakistani Rupees)

EXAMPLE GOOD RESPONSE:
"Your bill is high mainly due to peak usage during expensive hours (6-10 PM). Here's what you can do:
• Shift heavy appliances to off-peak hours (10 AM - 5 PM)
• Your AC set at 22-24°C is good, but try 24-26°C when away
• Weekend usage is 15% higher - watch for standby devices"

EXAMPLE BAD RESPONSE (TOO LONG):
"### Peak Day Overview | Day | Date | Why it's peak | ..." (NO TABLES!)

Keep it conversational and helpful. Be encouraging about savings.`;
}

/**
 * Send a message to Groq AI and get a response
 */
export async function sendChatMessage(
  userMessage: string,
  conversationHistory: ChatMessage[],
  context: AnalysisContext
): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('Groq API key not configured. Please add VITE_GROQ_API_KEY to your .env file.');
  }

  const systemPrompt = buildSystemPrompt(context);

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: messages,
        temperature: 0.5,
        max_tokens: 300,
        top_p: 0.9,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Groq API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
  } catch (error) {
    console.error('Groq API Error:', error);
    throw error;
  }
}

export default { sendChatMessage };
