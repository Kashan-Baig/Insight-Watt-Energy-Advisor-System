import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Clock, 
  Calendar, 
  TrendingUp, 
  Zap, 
  Thermometer, 
  Droplets, 
  Wind, 
  Sun,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConsumptionInsights } from '@/types/api';

interface ConsumptionInsightsCardProps {
  insights: ConsumptionInsights;
  className?: string;
}

export function ConsumptionInsightsCard({ insights, className }: ConsumptionInsightsCardProps) {
  const { usage_behavior, spike_profile, weather_context } = insights;

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Usage Behavior Card */}
      <Card variant="elevated" className="glass border-border/30">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            Usage Behavior
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Peak Hours */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground mb-1">Peak Hours</p>
              <div className="flex flex-wrap gap-1.5">
                {usage_behavior.peak_hours?.map((hour) => (
                  <span 
                    key={hour} 
                    className="px-2 py-0.5 text-xs rounded-full bg-warning/10 text-warning font-medium"
                  >
                    {formatHour(hour)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Peak Months */}
          {usage_behavior.peak_months && usage_behavior.peak_months.length > 0 && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-1">Peak Months</p>
                <div className="flex flex-wrap gap-1.5">
                  {usage_behavior.peak_months.map((month) => (
                    <span 
                      key={month} 
                      className="px-2 py-0.5 text-xs rounded-full bg-destructive/10 text-destructive font-medium"
                    >
                      {month}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Weekend Behavior */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Weekend Behavior</p>
              <p className="font-medium text-foreground capitalize">
                {usage_behavior.weekend_behavior || 'N/A'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Weekend Change</p>
              <p className={cn(
                "font-semibold",
                (usage_behavior.weekend_increase_percent || 0) > 0 ? 'text-destructive' : 'text-savings'
              )}>
                {usage_behavior.weekend_increase_percent !== undefined 
                  ? `${usage_behavior.weekend_increase_percent > 0 ? '+' : ''}${usage_behavior.weekend_increase_percent.toFixed(1)}%`
                  : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spike Profile Card */}
      <Card variant="elevated" className="glass border-border/30">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-warning" />
            </div>
            Spike Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-warning/5 border border-warning/20">
              <p className="text-xs text-muted-foreground mb-1">Spike Rate</p>
              <p className="text-lg font-bold text-warning">
                {spike_profile.spike_rate_percent?.toFixed(1) || '0'}%
              </p>
            </div>
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-xs text-muted-foreground mb-1">Avg Spike</p>
              <p className="text-lg font-bold text-primary">
                {spike_profile.avg_spike_kw?.toFixed(1) || '0'} kW
              </p>
            </div>
            <div className="p-3 rounded-xl bg-insight/5 border border-insight/20">
              <p className="text-xs text-muted-foreground mb-1">Weekend Spikes</p>
              <p className="text-lg font-bold text-insight">
                {spike_profile.weekend_spike_percent?.toFixed(1) || '0'}%
              </p>
            </div>
            <div className="p-3 rounded-xl bg-accent/5 border border-accent/20">
              <p className="text-xs text-muted-foreground mb-1">Peak Spike Hours</p>
              <p className="text-sm font-medium text-foreground">
                {spike_profile.spike_peak_hours?.slice(0, 2).map(formatHour).join(', ') || 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weather Context Card */}
      <Card variant="elevated" className="glass border-border/30">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-insight/10 flex items-center justify-center">
              <Sun className="w-4 h-4 text-insight" />
            </div>
            Weather Context
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
              <div className="flex items-center gap-2 mb-1">
                <Thermometer className="w-4 h-4 text-warning" />
                <p className="text-xs text-muted-foreground">Avg Temp</p>
              </div>
              <p className="font-semibold text-foreground">
                {weather_context.avg_temp_c?.toFixed(1) || 'N/A'}°C
              </p>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
              <div className="flex items-center gap-2 mb-1">
                <Sun className="w-4 h-4 text-insight" />
                <p className="text-xs text-muted-foreground">Thermal</p>
              </div>
              <p className="font-semibold text-foreground capitalize">
                {weather_context.thermal_condition || 'N/A'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
              <div className="flex items-center gap-2 mb-1">
                <Droplets className="w-4 h-4 text-blue-400" />
                <p className="text-xs text-muted-foreground">Humidity</p>
              </div>
              <p className="font-semibold text-foreground capitalize">
                {weather_context.humidity_level || 'N/A'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
              <div className="flex items-center gap-2 mb-1">
                <Wind className="w-4 h-4 text-accent" />
                <p className="text-xs text-muted-foreground">Ventilation</p>
              </div>
              <p className="font-semibold text-foreground capitalize">
                {weather_context.wind_cooling_effect?.replace(/-/g, ' ') || 'N/A'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-primary" />
                <p className="text-xs text-muted-foreground">Temp Correlation</p>
              </div>
              <p className="font-semibold text-foreground">
                {((weather_context.temp_kwh_correlation || weather_context.temp_correlation || 0) * 100).toFixed(0)}%
              </p>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-savings" />
                <p className="text-xs text-muted-foreground">Weather Driver</p>
              </div>
              <p className="font-semibold text-foreground capitalize">
                {weather_context.weather_driver?.replace(/-/g, ' ') || 'N/A'}
              </p>
            </div>
          </div>
          
          {/* Heat Stress Index */}
          {weather_context.heat_stress_index !== undefined && (
            <div className="mt-3 p-3 rounded-xl bg-warning/5 border border-warning/20 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Heat Stress Index</span>
              <span className={cn(
                "font-bold text-lg",
                weather_context.heat_stress_index > 35 ? 'text-destructive' : 
                weather_context.heat_stress_index > 30 ? 'text-warning' : 'text-savings'
              )}>
                {weather_context.heat_stress_index}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
