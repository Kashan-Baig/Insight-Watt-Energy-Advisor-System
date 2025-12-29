import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Calendar, TrendingUp, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RiskReport } from '@/types/api';

interface RiskReportCardProps {
  riskReport: RiskReport;
  className?: string;
}

export function RiskReportCard({ riskReport, className }: RiskReportCardProps) {
  const getSeverityStyles = (severity: string) => {
    const lower = severity.toLowerCase();
    if (lower === 'high') return { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/30' };
    if (lower === 'medium') return { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/30' };
    return { bg: 'bg-insight/10', text: 'text-insight', border: 'border-insight/30' };
  };

  return (
    <Card variant="elevated" className={cn('glass border-border/30', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Risk Report
          </CardTitle>
          <div className={cn(
            'flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium',
            riskReport.total_risk_days > 0 ? 'bg-warning/10 text-warning' : 'bg-savings/10 text-savings'
          )}>
            <Shield className="w-4 h-4" />
            <span>{riskReport.total_risk_days} Risk Days</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {riskReport.summary}
          </p>
        </div>

        {/* Risk Details */}
        {riskReport.risk_details && riskReport.risk_details.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">High-Risk Days:</p>
            <div className="space-y-2">
              {riskReport.risk_details.map((day, index) => {
                const styles = getSeverityStyles(day.severity);
                return (
                  <div 
                    key={day.date || index}
                    className={cn(
                      'p-4 rounded-xl border transition-all duration-300 hover:shadow-md',
                      styles.bg,
                      styles.border
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className={cn("w-4 h-4", styles.text)} />
                          <span className="font-medium text-foreground">
                            {new Date(day.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {day.reasons.map((reason, rIndex) => (
                            <p key={rIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5 flex-shrink-0" />
                              {reason}
                            </p>
                          ))}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-1">
                          <TrendingUp className={cn("w-4 h-4", styles.text)} />
                          <span className={cn("text-lg font-bold", styles.text)}>
                            {day.total_usage_kw.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">kW</span>
                        <div className={cn(
                          'mt-2 px-2 py-0.5 rounded-full text-xs font-medium',
                          styles.bg, styles.text
                        )}>
                          {day.severity}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {riskReport.total_risk_days === 0 && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-savings/10 border border-savings/30">
            <Shield className="w-6 h-6 text-savings" />
            <div>
              <p className="font-medium text-savings">No High-Risk Days Detected</p>
              <p className="text-sm text-muted-foreground">Your energy consumption looks stable for the coming week.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
