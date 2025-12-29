import { Card, CardContent } from '@/components/ui/card';
import { Coins, TrendingDown, TreePine } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SavingsSimulationProps {
  monthlySavings: number;
  billReduction: number;
  co2Impact: number;
  adherenceRate?: number;
  className?: string;
}

export function SavingsSimulation({
  monthlySavings,
  billReduction,
  co2Impact,
  adherenceRate = 80,
  className,
}: SavingsSimulationProps) {
  const stats = [
    {
      icon: Coins,
      label: 'Monthly Savings',
      value: `Rs. ${monthlySavings.toLocaleString()}`,
      color: 'text-savings',
      bg: 'bg-savings/10',
    },
    {
      icon: TrendingDown,
      label: 'Bill Reduction',
      value: `${billReduction}%`,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      icon: TreePine,
      label: 'CO₂ Impact',
      value: `${co2Impact} trees`,
      color: 'text-insight',
      bg: 'bg-insight/10',
    },
  ];

  return (
    <Card variant="savings" className={cn('overflow-hidden', className)}>
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <p className="text-lg text-savings font-medium mb-1">
            If you follow {adherenceRate}% of this plan...
          </p>
          <p className="text-sm text-muted-foreground">
            Here's what you could save each month
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="text-center opacity-0 animate-scale-in"
              style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'forwards' }}
            >
              <div className={cn('w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center', stat.bg)}>
                <stat.icon className={cn('w-6 h-6', stat.color)} />
              </div>
              <p className={cn('text-2xl font-bold mb-1', stat.color)}>{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
