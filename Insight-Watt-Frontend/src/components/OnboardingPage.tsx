import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UploadBox } from '@/components/UploadBox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Home, Thermometer, Clock, Target, Heart, Zap, Loader2, Users, Building, Sun, Flame, Droplets, WashingMachine, Microwave, X, Snowflake, ThermometerSun, ThermometerSnowflake, Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEnergyAnalysisFlow } from '@/hooks/useApi';
import type { QuestionnaireAnswers } from '@/types/api';
import { useToast } from '@/hooks/use-toast';

interface OnboardingPageProps {
  onComplete: (analysisId: string) => void;
  onBack: () => void;
}

type Step = 'upload' | 'questions';

interface QuestionOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface Question {
  id: keyof QuestionnaireAnswers;
  title: string;
  description: string;
  options: QuestionOption[];
  conditionalOn?: { field: keyof QuestionnaireAnswers; value: string };
}

const questions: Question[] = [
  {
    id: 'q1',
    title: 'How many people live in your home?',
    description: 'This helps us understand your baseline consumption',
    options: [
      { value: '1-2', label: '1-2 People', icon: <Users className="w-5 h-5" /> },
      { value: '3-4', label: '3-4 People', icon: <Home className="w-5 h-5" /> },
      { value: '5+', label: '5+ People', icon: <Building className="w-5 h-5" /> },
    ],
  },
  {
    id: 'q2',
    title: 'How occupied is your home during daytime?',
    description: 'This helps us identify daytime load patterns',
    options: [
      { value: 'Mostly empty', label: 'Mostly empty', icon: <Sun className="w-5 h-5" /> },
      { value: 'Partially occupied', label: 'Partially occupied', icon: <Clock className="w-5 h-5" /> },
      { value: 'Mostly occupied', label: 'Mostly occupied', icon: <Home className="w-5 h-5" /> },
    ],
  },
  {
    id: 'q3',
    title: 'Do you use air conditioning / HVAC?',
    description: 'Cooling typically accounts for 40-60% of electricity bills',
    options: [
      { value: 'Yes', label: 'Yes', icon: <Thermometer className="w-5 h-5" /> },
      { value: 'No', label: 'No', icon: <X className="w-5 h-5" /> },
    ],
  },
  {
    id: 'q3_1',
    title: 'What is your preferred thermal comfort setpoint?',
    description: 'The temperature range you typically set your AC to',
    options: [
      { value: '18-20', label: '18-20°C (Cool)', icon: <Snowflake className="w-5 h-5" /> },
      { value: '20-22', label: '20-22°C (Comfortable)', icon: <ThermometerSnowflake className="w-5 h-5" /> },
      { value: '22-24', label: '22-24°C (Moderate)', icon: <ThermometerSun className="w-5 h-5" /> },
      { value: '24-26', label: '24-26°C (Energy Saving)', icon: <Leaf className="w-5 h-5" /> },
    ],
    conditionalOn: { field: 'q3', value: 'Yes' },
  },
  {
    id: 'q4',
    title: 'What\'s your water heating source?',
    description: 'Water heating can be a significant energy consumer',
    options: [
      { value: 'Electric geyser', label: 'Electric Geyser', icon: <Zap className="w-5 h-5" /> },
      { value: 'Gas geyser', label: 'Gas Geyser', icon: <Flame className="w-5 h-5" /> },
      { value: 'Solar', label: 'Solar Water Heater', icon: <Sun className="w-5 h-5" /> },
      { value: 'None', label: 'None', icon: <Droplets className="w-5 h-5" /> },
    ],
  },
  {
    id: 'q5',
    title: 'How many heavy appliances do you use regularly?',
    description: 'E.g., washing machine, dryer, dishwasher, oven',
    options: [
      { value: '0-1', label: '0-1 Appliances', icon: <Microwave className="w-5 h-5" /> },
      { value: '2-3', label: '2-3 Appliances', icon: <WashingMachine className="w-5 h-5" /> },
      { value: '4+', label: '4+ Appliances', icon: <Zap className="w-5 h-5" /> },
    ],
  },
];

export function OnboardingPage({ onComplete, onBack }: OnboardingPageProps) {
  const [step, setStep] = useState<Step>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuestionnaireAnswers>>({});
  
  const { startAnalysis, isLoading, isUploading, isAnalyzing, error } = useEnergyAnalysisFlow();
  const { toast } = useToast();

  // Get visible questions (filter out conditional ones that don't apply)
  const visibleQuestions = questions.filter(q => {
    if (!q.conditionalOn) return true;
    return answers[q.conditionalOn.field] === q.conditionalOn.value;
  });

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleAnswer = (questionId: keyof QuestionnaireAnswers, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }));

    setTimeout(() => {
      if (currentQuestion < visibleQuestions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
      } else {
        // All questions answered, submit analysis
        handleSubmitAnalysis({
          ...answers,
          [questionId]: value,
        } as QuestionnaireAnswers);
      }
    }, 300);
  };

  const handleSubmitAnalysis = async (finalAnswers: QuestionnaireAnswers) => {
    if (!selectedFile) return;

    try {
      const result = await startAnalysis(selectedFile, finalAnswers);
      toast({
        title: 'Analysis Complete',
        description: 'Your energy analysis is ready!',
      });
      onComplete(result.analysisId);
    } catch (err) {
      toast({
        title: 'Analysis Failed',
        description: error?.message || 'An error occurred during analysis',
        variant: 'destructive',
      });
    }
  };

  const handleContinueToQuestions = () => {
    setStep('questions');
  };

  const question = visibleQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / visibleQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 gradient-mesh pointer-events-none opacity-40" />
      <div className="fixed top-20 right-20 w-[400px] h-[400px] bg-accent/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-20 left-20 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-20 border-b border-border/30 glass sticky top-0">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-glow">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-foreground">Insight Watt</span>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-6 py-12">
        {step === 'upload' ? (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center">
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
                Upload Your Smart Meter Data
              </h1>
              <p className="text-muted-foreground text-lg">
                We'll analyze your consumption patterns and create a personalized plan
              </p>
            </div>

            <UploadBox onFileSelect={handleFileSelect} />

            <Button
              variant="hero"
              size="lg"
              className="w-full gradient-primary"
              onClick={handleContinueToQuestions}
              disabled={!selectedFile}
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Quick questions</span>
                <span className="text-muted-foreground">{currentQuestion + 1} of {visibleQuestions.length}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full gradient-primary rounded-full transition-all duration-500 ease-out shadow-glow"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <Card variant="elevated" className="overflow-hidden glass border-border/30">
                <CardContent className="p-8 flex flex-col items-center justify-center">
                  <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                  <CardTitle className="font-display text-xl mb-2">
                    {isUploading ? 'Uploading your data...' : 'Analyzing your energy patterns...'}
                  </CardTitle>
                  <CardDescription className="text-center">
                    {isUploading 
                      ? 'Please wait while we upload your smart meter data.'
                      : 'Our AI is analyzing your consumption patterns. This may take 1-2 minutes.'}
                  </CardDescription>
                </CardContent>
              </Card>
            )}

            {/* Question Card */}
            {!isLoading && question && (
              <Card variant="elevated" className="overflow-hidden glass border-border/30">
                <CardHeader className="pb-4">
                  <CardTitle className="font-display text-2xl">{question.title}</CardTitle>
                  <CardDescription className="text-base">{question.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {question.options.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleAnswer(question.id, option.value)}
                      className={cn(
                        'w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-300',
                        'hover:border-primary/50 hover:bg-primary/10',
                        answers[question.id] === option.value
                          ? 'border-primary bg-primary/15 shadow-glow'
                          : 'border-border/30 bg-muted/30'
                      )}
                    >
                      {option.icon && (
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                          {option.icon}
                        </div>
                      )}
                      <span className="font-medium text-foreground">{option.label}</span>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            {!isLoading && currentQuestion > 0 && (
              <button
                onClick={() => setCurrentQuestion(prev => prev - 1)}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Previous question</span>
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}