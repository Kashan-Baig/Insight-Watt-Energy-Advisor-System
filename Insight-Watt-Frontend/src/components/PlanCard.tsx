import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Calendar, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface PlanDay {
  day: string;
  date?: string;
  action: string;
  reason: string;
  estimatedSaving?: number;
  completed?: boolean;
  skipped?: boolean;
}

interface PlanCardProps {
  plan: PlanDay;
  onComplete?: () => void;
  onSkip?: () => void;
  className?: string;
  delay?: number;
}

export function PlanCard({ plan, onComplete, onSkip, className, delay = 0 }: PlanCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Check if action/reason is long
  const isLongAction = plan.action.length > 100;
  const isLongReason = plan.reason.length > 100;
  const needsExpansion = isLongAction || isLongReason;

  return (
    <Card
      variant="elevated"
      className={cn(
        'overflow-hidden opacity-0 animate-fade-in hover:shadow-xl transition-all duration-300',
        plan.completed && 'border-savings/50 bg-savings-muted/30',
        plan.skipped && 'opacity-60',
        className
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <div className="flex">
        {/* Day Badge */}
        <div className="w-20 bg-primary/5 flex flex-col items-center justify-center p-4 border-r border-border/50">
          <Calendar className="w-5 h-5 text-primary mb-1" />
          <span className="text-xs font-medium text-muted-foreground">{plan.day.slice(0, 3)}</span>
          {plan.date && (
            <span className="text-[10px] text-muted-foreground mt-0.5">
              {new Date(plan.date).getDate()}
            </span>
          )}
        </div>

        {/* Content */}
        <CardContent className="flex-1 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Action */}
              <div className="flex items-start gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground leading-relaxed">
                    {isLongAction && !isExpanded 
                      ? plan.action.slice(0, 100) + '...' 
                      : plan.action}
                  </p>
                </div>
              </div>

              {/* Reason */}
              <div className="flex items-start gap-2 mb-3 ml-8">
                <Lightbulb className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {isLongReason && !isExpanded 
                    ? plan.reason.slice(0, 100) + '...' 
                    : plan.reason}
                </p>
              </div>

              {/* Expand/Collapse Button */}
              {needsExpansion && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="ml-8 text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      Read more
                    </>
                  )}
                </button>
              )}

              {/* Saving Badge */}
              {plan.estimatedSaving !== undefined && plan.estimatedSaving > 0 && (
                <div className="flex items-center gap-2 ml-8 mt-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-savings/10 text-savings">
                    <span className="text-sm font-semibold">Save Rs. {plan.estimatedSaving}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {!plan.completed && !plan.skipped && onComplete && onSkip && (
              <div className="flex flex-col gap-2 flex-shrink-0">
                <Button
                  size="icon"
                  variant="savings"
                  className="h-9 w-9 rounded-full"
                  onClick={onComplete}
                  title="I followed this"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 rounded-full text-muted-foreground hover:text-destructive"
                  onClick={onSkip}
                  title="Couldn't follow"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {plan.completed && (
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-savings text-savings-foreground flex-shrink-0">
                <Check className="w-5 h-5" />
              </div>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
