import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ConsumptionData } from '@/types';
import { generateMockConsumptionData, getDailyConsumption } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { BarChart3, TrendingUp } from 'lucide-react';
import type { ForecastDataPoint } from '@/types/api';

interface ChartCardProps {
  data?: ConsumptionData[];
  forecastData?: ForecastDataPoint[];
  title?: string;
  className?: string;
}

type ViewMode = 'hourly' | 'daily';

export function ChartCard({ data, forecastData, title = "Energy Consumption", className }: ChartCardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('hourly');
  
  const isForecast = forecastData && forecastData.length > 0;

  // Hourly data (original)
  const hourlyData = useMemo(() => {
    if (forecastData && forecastData.length > 0) {
      return forecastData.map((item, index) => {
        const dateObj = new Date(item.datetime);
        const hour = dateObj.getHours();
        const isMidnight = hour === 0;
        const dateLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        return {
          index,
          date: dateLabel,
          dayName,
          fullDate: dateObj.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: 'numeric',
            hour12: true
          }),
          kWh: item.predicted_usage,
          datetime: item.datetime,
          isMidnight,
        };
      });
    }
    const consumptionData = data || generateMockConsumptionData();
    const dailyConsumption = getDailyConsumption(consumptionData);
    return dailyConsumption.slice(-14).map((item, index) => {
      const dateObj = new Date(item.date);
      return {
        index,
        date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dayName: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDate: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        kWh: item.kWh,
        datetime: item.date,
        isMidnight: true,
      };
    });
  }, [forecastData, data]);

  // Daily cumulative data
  const dailyData = useMemo(() => {
    if (!forecastData || forecastData.length === 0) {
      return hourlyData; // Fall back to hourly for mock data
    }

    // Group by date and sum kWh
    const dailyMap = new Map<string, { kWh: number; datetime: string }>();
    
    forecastData.forEach(item => {
      const dateObj = new Date(item.datetime);
      const dateKey = dateObj.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      const current = dailyMap.get(dateKey);
      if (current) {
        dailyMap.set(dateKey, { kWh: current.kWh + item.predicted_usage, datetime: item.datetime });
      } else {
        dailyMap.set(dateKey, { kWh: item.predicted_usage, datetime: item.datetime });
      }
    });

    return Array.from(dailyMap.entries()).map(([date, data]) => {
      const dateObj = new Date(data.datetime);
      return {
        date,
        dayName: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
        kWh: parseFloat(data.kWh.toFixed(2)),
      };
    });
  }, [forecastData, hourlyData]);

  const chartData = viewMode === 'hourly' ? hourlyData : dailyData;
  const avgConsumption = chartData.reduce((sum, d) => sum + d.kWh, 0) / chartData.length;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      // Use fullDate if available (for hourly view), otherwise use date
      const displayLabel = payload[0]?.payload?.fullDate || payload[0]?.payload?.date || '';
      return (
        <div className="glass border border-primary/30 rounded-lg shadow-lg shadow-primary/10 p-3">
          <p className="font-medium text-foreground">{displayLabel}</p>
          <p className="text-sm text-primary text-glow-sm">
            <span className="font-semibold">{payload[0].value.toFixed(2)}</span> kWh
            {isForecast && (
              <span className="text-xs ml-1 text-muted-foreground">
                ({viewMode === 'daily' ? 'daily total' : 'predicted'})
              </span>
            )}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card variant="elevated" className={cn('glass border-border/30', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-lg">{title}</CardTitle>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            {isForecast && (
              <div className="flex items-center bg-muted/50 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('hourly')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                    viewMode === 'hourly' 
                      ? 'bg-primary/20 text-primary shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Hourly
                </button>
                <button
                  onClick={() => setViewMode('daily')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                    viewMode === 'daily' 
                      ? 'bg-primary/20 text-primary shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  Daily
                </button>
              </div>
            )}
            {isForecast && (
              <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary font-medium">
                AI Forecast
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'daily' && isForecast ? (
              // Area chart for daily cumulative view
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDaily" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(160, 100%, 40%)" stopOpacity={0.4} />
                    <stop offset="50%" stopColor="hsl(160, 100%, 40%)" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="hsl(160, 100%, 40%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 20%, 20%)" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="hsl(220, 15%, 55%)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tick={({ x, y, payload }) => {
                    const item = chartData.find(d => d.date === payload.value);
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text x={0} y={0} dy={10} textAnchor="middle" fill="hsl(220, 15%, 55%)" fontSize={11}>
                          {payload.value}
                        </text>
                        <text x={0} y={0} dy={24} textAnchor="middle" fill="hsl(220, 15%, 45%)" fontSize={10}>
                          ({item?.dayName})
                        </text>
                      </g>
                    );
                  }}
                  height={45}
                />
                <YAxis
                  stroke="hsl(220, 15%, 55%)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                  unit=" kWh"
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine 
                  y={avgConsumption} 
                  stroke="hsl(220, 15%, 45%)" 
                  strokeDasharray="5 5"
                  label={{ 
                    value: `Avg: ${avgConsumption.toFixed(1)} kWh`, 
                    position: 'right',
                    fill: 'hsl(220, 15%, 55%)',
                    fontSize: 11
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="kWh"
                  stroke="hsl(160, 100%, 40%)"
                  strokeWidth={2.5}
                  fill="url(#colorDaily)"
                  dot={{ r: 4, fill: 'hsl(160, 100%, 40%)', stroke: 'hsl(160, 100%, 50%)', strokeWidth: 2 }}
                  activeDot={{ 
                    r: 6, 
                    fill: 'hsl(160, 100%, 40%)', 
                    stroke: 'hsl(160, 100%, 50%)', 
                    strokeWidth: 2 
                  }}
                />
              </AreaChart>
            ) : (
              // Area chart for hourly view
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorKwh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isForecast ? "hsl(280, 100%, 60%)" : "hsl(185, 100%, 50%)"} stopOpacity={0.4} />
                    <stop offset="50%" stopColor={isForecast ? "hsl(280, 100%, 60%)" : "hsl(185, 100%, 50%)"} stopOpacity={0.1} />
                    <stop offset="95%" stopColor={isForecast ? "hsl(280, 100%, 60%)" : "hsl(185, 100%, 50%)"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 20%, 20%)" vertical={false} />
                <XAxis
                  dataKey="index"
                  stroke="hsl(220, 15%, 55%)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  ticks={chartData.filter(d => d.isMidnight).map(d => d.index)}
                  tick={({ x, y, payload }) => {
                    const item = chartData.find(d => d.index === payload.value);
                    if (!item) return null;
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text x={0} y={0} dy={10} textAnchor="middle" fill="hsl(220, 15%, 55%)" fontSize={11}>
                          {item.date}
                        </text>
                        <text x={0} y={0} dy={24} textAnchor="middle" fill="hsl(220, 15%, 45%)" fontSize={10}>
                          ({item.dayName})
                        </text>
                      </g>
                    );
                  }}
                  height={45}
                />
                <YAxis
                  stroke="hsl(220, 15%, 55%)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                  unit=" kWh"
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine 
                  y={avgConsumption} 
                  stroke="hsl(220, 15%, 45%)" 
                  strokeDasharray="5 5"
                  label={{ 
                    value: `Avg: ${avgConsumption.toFixed(1)} kWh`, 
                    position: 'right',
                    fill: 'hsl(220, 15%, 55%)',
                    fontSize: 11
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="kWh"
                  stroke={isForecast ? "hsl(280, 100%, 60%)" : "hsl(185, 100%, 50%)"}
                  strokeWidth={2.5}
                  fill="url(#colorKwh)"
                  dot={false}
                  activeDot={{ 
                    r: 6, 
                    fill: isForecast ? 'hsl(280, 100%, 60%)' : 'hsl(185, 100%, 50%)', 
                    stroke: isForecast ? 'hsl(280, 100%, 70%)' : 'hsl(185, 100%, 70%)', 
                    strokeWidth: 2 
                  }}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border/30">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-3 h-3 rounded-full shadow-glow",
              viewMode === 'daily' ? "bg-emerald-500" : (isForecast ? "bg-purple-500" : "bg-primary")
            )} />
            <span className="text-sm text-muted-foreground">
              {viewMode === 'daily' ? 'Daily Total' : (isForecast ? 'Predicted Usage' : 'Daily Usage')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0 border-t-2 border-dashed border-muted-foreground" />
            <span className="text-sm text-muted-foreground">Average</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}