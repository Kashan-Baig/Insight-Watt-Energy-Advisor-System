import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Thermometer, Droplets, Zap, Home, Wind } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/types/api';

interface ProfileCardProps {
  profile: UserProfile;
  className?: string;
}

export function ProfileCard({ profile, className }: ProfileCardProps) {
  const profileItems = [
    {
      icon: Users,
      label: 'Occupancy Density',
      value: profile.occupancy_density?.charAt(0).toUpperCase() + profile.occupancy_density?.slice(1) || 'N/A',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: Home,
      label: 'Daytime Load Probability',
      value: profile.daytime_load_probability ? `${(profile.daytime_load_probability * 100).toFixed(0)}%` : 'N/A',
      color: 'text-insight',
      bgColor: 'bg-insight/10',
    },
    {
      icon: Wind,
      label: 'HVAC Usage',
      value: profile.hvac_usage?.charAt(0).toUpperCase() + profile.hvac_usage?.slice(1) || 'N/A',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      icon: Thermometer,
      label: 'Thermal Comfort Setpoint',
      value: profile.thermal_comfort_setpoint ? `${profile.thermal_comfort_setpoint}°C` : 'N/A',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      icon: Droplets,
      label: 'Water Heating Source',
      value: profile.water_heating_source?.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'N/A',
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
    },
    {
      icon: Zap,
      label: 'Appliance Load Tier',
      value: profile.appliance_load_tier?.charAt(0).toUpperCase() + profile.appliance_load_tier?.slice(1) || 'N/A',
      color: 'text-savings',
      bgColor: 'bg-savings/10',
    },
  ];

  return (
    <Card variant="elevated" className={cn('glass border-border/30', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Energy Profile</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">Your household energy characteristics</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {profileItems.map((item, index) => (
            <div 
              key={item.label}
              className={cn(
                "p-4 rounded-xl border border-border/30 transition-all duration-300 hover:shadow-md",
                "opacity-0 animate-fade-in"
              )}
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
            >
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-3", item.bgColor)}>
                <item.icon className={cn("w-5 h-5", item.color)} />
              </div>
              <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
              <p className={cn("font-semibold text-foreground", item.color)}>{item.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
