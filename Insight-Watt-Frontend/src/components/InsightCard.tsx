import { Insight } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface InsightCardProps {
  insight: Insight;
  className?: string;
  delay?: number;
}

export function InsightCard({ insight, className, delay = 0 }: InsightCardProps) {
  const variantStyles = {
    warning: {
      card: 'warning' as const,
      iconBg: 'bg-warning/20',
      iconText: 'text-warning',
      valueBg: 'bg-warning/20 text-warning',
      borderGlow: 'hover:border-warning/40',
    },
    insight: {
      card: 'insight' as const,
      iconBg: 'bg-insight/20',
      iconText: 'text-insight',
      valueBg: 'bg-insight/20 text-insight',
      borderGlow: 'hover:border-insight/40',
    },
    savings: {
      card: 'savings' as const,
      iconBg: 'bg-savings/20',
      iconText: 'text-savings',
      valueBg: 'bg-savings/20 text-savings',
      borderGlow: 'hover:border-savings/40',
    },
  };

  const styles = variantStyles[insight.type];

  return (
    <Card
      variant={styles.card}
      className={cn(
        'hover:shadow-lg hover:-translate-y-1 cursor-default opacity-0 animate-fade-in transition-all duration-300',
        styles.borderGlow,
        className
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-2xl', styles.iconBg)}>
            {insight.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="font-display font-semibold text-foreground truncate">{insight.title}</h3>
              {insight.value && (
                <span className={cn('text-sm font-bold px-2 py-0.5 rounded-full', styles.valueBg)}>
                  {insight.value}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {insight.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}