import { Button } from '@/components/ui/button';
import { Zap, ChevronRight, BarChart3, Brain, Lightbulb, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LandingPageProps {
  onGetStarted: () => void;
  onTryDemo: () => void;
}

export function LandingPage({ onGetStarted, onTryDemo }: LandingPageProps) {
  const features = [
    {
      icon: BarChart3,
      title: 'Understand Your Usage',
      description: 'Visual insights into when and how you consume electricity',
      gradient: 'from-primary/20 to-primary/5',
    },
    {
      icon: Brain,
      title: 'AI-Powered Analysis',
      description: 'Get personalized explanations for your energy patterns',
      gradient: 'from-accent/20 to-accent/5',
    },
    {
      icon: Lightbulb,
      title: '7-Day Action Plan',
      description: 'Practical daily tips tailored to your lifestyle',
      gradient: 'from-savings/20 to-savings/5',
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 gradient-mesh pointer-events-none" />
      
      {/* Animated Orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-accent/20 rounded-full blur-[100px] animate-pulse-slow" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/15 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-savings/10 rounded-full blur-[150px] animate-pulse-slow" style={{ animationDelay: '4s' }} />
      
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-display font-bold text-foreground">Insight Watt</span>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-28">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/30 text-sm font-medium mb-10 opacity-0 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-foreground">AI-Powered Energy Advisor</span>
          </div>

          {/* Main Headline */}
          <h1 className="font-display text-foreground mb-8 leading-[1.1] opacity-0 animate-fade-in tracking-tight" style={{ animationDelay: '100ms' }}>
            Predict your electricity bill.{' '}
            <br className="hidden md:block" />
            <span className="text-gradient-primary text-glow-sm">Reduce it with AI.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed opacity-0 animate-fade-in" style={{ animationDelay: '200ms' }}>
            Upload your smart meter data and get a personalized 7-day energy-saving plan powered by AI.
            <span className="text-foreground/80"> No technical knowledge required.</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 opacity-0 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <Button variant="hero" size="xl" onClick={onGetStarted} className="min-w-[220px] gradient-primary text-primary-foreground border-0 shadow-glow hover:shadow-lg transition-all duration-300">
              Upload Your Data
              <ChevronRight className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="xl" onClick={onTryDemo} className="min-w-[220px] glass border-border/50 hover:border-primary/50 hover:bg-primary/10 transition-all duration-300">
              Try Demo Data
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm text-muted-foreground opacity-0 animate-fade-in" style={{ animationDelay: '400ms' }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-savings shadow-glow-savings" />
              <span>100% Private</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-savings shadow-glow-savings" />
              <span>No signup required</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-savings shadow-glow-savings" />
              <span>Instant analysis</span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-28">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={cn(
                'group relative rounded-2xl p-8 border border-border/50',
                'glass hover:border-primary/30 transition-all duration-500',
                'opacity-0 animate-fade-in-up'
              )}
              style={{ animationDelay: `${500 + index * 100}ms`, animationFillMode: 'forwards' }}
            >
              {/* Gradient overlay on hover */}
              <div className={cn(
                'absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500',
                feature.gradient
              )} />
              
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-muted to-muted/50 border border-border/50 flex items-center justify-center mb-6 group-hover:border-primary/30 transition-colors duration-300">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/30 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>Built with <span className="text-peak">❤️</span> by Team ALGOHOLICS</p>
        </div>
      </footer>
    </div>
  );
}