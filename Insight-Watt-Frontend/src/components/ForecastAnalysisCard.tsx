import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Lightbulb, Calendar, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ForecastAnalysis } from '@/types/api';

interface ForecastAnalysisCardProps {
  analysis: ForecastAnalysis;
  className?: string;
}

export function ForecastAnalysisCard({ analysis, className }: ForecastAnalysisCardProps) {
  const { forecast_summary, forecast_insights, daily_breakdown } = analysis;

  return (
    <Card variant="elevated" className={cn('glass border-border/30', className)}>
      <CardHeader className="pb-4">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <LineChart className="w-4 h-4 text-primary" />
          </div>
          Forecast Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {forecast_summary}
          </p>
        </div>

        {/* Daily Breakdown */}
        {daily_breakdown && (
          <div className="grid grid-cols-3 gap-3">
            {daily_breakdown.highest_day && (
              <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/20 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp className="w-4 h-4 text-destructive" />
                </div>
                <p className="text-xs text-muted-foreground mb-1">Highest Day</p>
                <p className="font-semibold text-destructive">{daily_breakdown.highest_day}</p>
              </div>
            )}
            {daily_breakdown.lowest_day && (
              <div className="p-3 rounded-xl bg-savings/5 border border-savings/20 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingDown className="w-4 h-4 text-savings" />
                </div>
                <p className="text-xs text-muted-foreground mb-1">Lowest Day</p>
                <p className="font-semibold text-savings">{daily_breakdown.lowest_day}</p>
              </div>
            )}
            {daily_breakdown.pattern_type && (
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <BarChart3 className="w-4 h-4 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground mb-1">Pattern</p>
                <p className="font-semibold text-primary capitalize">
                  {daily_breakdown.pattern_type.replace(/-/g, ' ')}
                </p>
              </div>
            )}
          </div>
        )}


      </CardContent>
    </Card>
  );
}
