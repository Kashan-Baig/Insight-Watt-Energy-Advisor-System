import { useState } from 'react';
import { LandingPage } from '@/components/LandingPage';
import { OnboardingPage } from '@/components/OnboardingPage';
import { DashboardPage } from '@/components/DashboardPage';
import { Helmet } from 'react-helmet-async';

type AppStep = 'landing' | 'onboarding' | 'dashboard';

const Index = () => {
  const [step, setStep] = useState<AppStep>('landing');
  const [analysisId, setAnalysisId] = useState<string | null>(null);

  const handleGetStarted = () => {
    setStep('onboarding');
  };

  const handleTryDemo = () => {
    // Demo mode - use null analysisId to show mock data
    setAnalysisId(null);
    setStep('dashboard');
  };

  const handleOnboardingComplete = (newAnalysisId: string) => {
    console.log('Analysis completed with ID:', newAnalysisId);
    setAnalysisId(newAnalysisId);
    setStep('dashboard');
  };

  const handleBackToLanding = () => {
    setStep('landing');
    setAnalysisId(null);
  };

  return (
    <>
      <Helmet>
        <title>Insight Watt - AI Smart Meter Behavioral Advisor</title>
        <meta 
          name="description" 
          content="Predict your electricity bill and reduce it with AI. Upload your smart meter data and get a personalized 7-day energy-saving plan." 
        />
      </Helmet>

      {step === 'landing' && (
        <LandingPage onGetStarted={handleGetStarted} onTryDemo={handleTryDemo} />
      )}

      {step === 'onboarding' && (
        <OnboardingPage 
          onComplete={handleOnboardingComplete} 
          onBack={handleBackToLanding} 
        />
      )}

      {step === 'dashboard' && (
        <DashboardPage 
          onBackToLanding={handleBackToLanding}
          analysisId={analysisId}
        />
      )}
    </>
  );
};

export default Index;
