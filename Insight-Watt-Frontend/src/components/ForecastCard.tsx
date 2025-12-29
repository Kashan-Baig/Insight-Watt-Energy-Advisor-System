import { BillForecast } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, AlertTriangle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ForecastCardProps {
  forecast: BillForecast;
  className?: string;
}

export function ForecastCard({ forecast, className }: ForecastCardProps) {
  const isIncreasing = (forecast.percentageChange ?? 0) > 0;

  return (
    <Card variant="elevated" className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Predicted Monthly Bill
          </CardTitle>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-insight/10 text-insight text-sm font-medium">
            <span>{forecast.confidence}% confidence</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Amount */}
        <div className="text-center py-4">
          <p className="text-6xl font-bold text-foreground tracking-tight">
            Rs. {forecast.predictedAmount.toLocaleString()}
          </p>
          {forecast.previousAmount && (
            <div className="flex items-center justify-center gap-2 mt-3">
              {isIncreasing ? (
                <TrendingUp className="w-5 h-5 text-warning" />
              ) : (
                <TrendingDown className="w-5 h-5 text-savings" />
              )}
              <span className={cn(
                'text-sm font-medium',
                isIncreasing ? 'text-warning' : 'text-savings'
              )}>
                {isIncreasing ? '+' : ''}{forecast.percentageChange?.toFixed(1)}% vs last month
              </span>
            </div>
          )}
        </div>

        {/* Warning Alert */}
        {isIncreasing && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/5 border border-warning/20">
            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-warning">Bill Increase Alert</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your bill may increase by {forecast.percentageChange?.toFixed(1)}% if no action is taken. 
                Follow the energy plan to reduce this.
              </p>
            </div>
          </div>
        )}

        {/* Breakdown */}
        {forecast.breakdown && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Usage Breakdown</p>
            <div className="space-y-2">
              {forecast.breakdown.map((item, index) => (
                <div key={item.category} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-foreground">{item.category}</span>
                      <span className="text-sm font-medium text-foreground">
                        Rs. {item.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          index === 0 ? 'bg-primary' : 
                          index === 1 ? 'bg-insight' :
                          index === 2 ? 'bg-warning' :
                          'bg-muted-foreground'
                        )}
                        style={{ 
                          width: `${item.percentage}%`,
                          animationDelay: `${index * 100}ms`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
