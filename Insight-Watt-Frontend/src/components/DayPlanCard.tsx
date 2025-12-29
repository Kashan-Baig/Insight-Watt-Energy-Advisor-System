import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Calendar, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import type { DayPlanAction } from '@/types/api';

interface DayPlanCardProps {
  dayLabel: string;  // "Day 1", "Day 2", etc.
  date?: string;
  actions: DayPlanAction[];
  onComplete?: () => void;
  onSkip?: () => void;
  completed?: boolean;
  skipped?: boolean;
  className?: string;
  delay?: number;
}

export function DayPlanCard({ 
  dayLabel, 
  date, 
  actions, 
  onComplete, 
  onSkip, 
  completed,
  skipped,
  className, 
  delay = 0 
}: DayPlanCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Get first action for preview
  const firstAction = actions[0];
  const hasMultipleActions = actions.length > 1;

  return (
    <Card
      variant="elevated"
      className={cn(
        'overflow-hidden opacity-0 animate-fade-in hover:shadow-xl transition-all duration-300',
        completed && 'border-savings/50 bg-savings-muted/30',
        skipped && 'opacity-60',
        className
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <div className="flex">
        {/* Day Badge */}
        <div className="w-24 bg-primary/5 flex flex-col items-center justify-center p-4 border-r border-border/50">
          <Calendar className="w-5 h-5 text-primary mb-1" />
          <span className="text-sm font-medium text-foreground">{dayLabel}</span>
          {date && (
            <span className="text-xs text-muted-foreground mt-0.5">
              {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>

        {/* Content */}
        <CardContent className="flex-1 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Preview - First Action Summary */}
              {!isExpanded && (
                <div className="mb-2">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">
                      {firstAction?.action.slice(0, 120)}{firstAction?.action.length > 120 ? '...' : ''}
                    </p>
                  </div>
                  {hasMultipleActions && (
                    <p className="text-xs text-muted-foreground ml-8 mt-1">
                      +{actions.length - 1} more action{actions.length > 2 ? 's' : ''}
                    </p>
                  )}
                </div>
              )}

              {/* Expanded View - All Actions */}
              {isExpanded && (
                <div className="space-y-4">
                  {actions.map((actionItem, index) => (
                    <div key={index} className="space-y-2">
                      {/* Action */}
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground leading-relaxed">
                            {actionItem.action}
                          </p>
                        </div>
                      </div>

                      {/* Reason */}
                      <div className="flex items-start gap-2 ml-8">
                        <Lightbulb className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {actionItem.reason}
                        </p>
                      </div>

                      {/* Divider between actions */}
                      {index < actions.length - 1 && (
                        <div className="border-t border-border/30 mt-3 pt-3 ml-8" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Expand/Collapse Button */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-3 text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors font-medium"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    View details
                  </>
                )}
              </button>
            </div>

            {/* Action Buttons */}
            {!completed && !skipped && onComplete && onSkip && (
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

            {completed && (
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
