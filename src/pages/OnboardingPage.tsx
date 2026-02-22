import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { ArrowRight, Map, Mic, Sparkles } from 'lucide-react';

const steps = [
  {
    icon: Map,
    title: 'Welcome to NetMind',
    description: 'Your relationships, visualized as a living mind map. See your entire network at a glance.',
  },
  {
    icon: Mic,
    title: 'Add contacts your way',
    description: 'Type, speak, or scan a business card — AI extracts and organizes everything for you.',
  },
  {
    icon: Sparkles,
    title: 'Your network is alive',
    description: 'Smart reminders, natural language search, and audience-targeted posts keep you connected.',
  },
];

const OnboardingPage = () => {
  const [step, setStep] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleComplete = async () => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ onboarding_completed: true } as any)
      .eq('id', user.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    navigate('/');
  };

  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center space-y-8">
        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === step ? 32 : 12,
                backgroundColor: i <= step ? 'hsl(var(--primary))' : 'hsl(var(--secondary))',
              }}
            />
          ))}
        </div>

        {/* Icon */}
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Icon className="w-10 h-10 text-primary" />
        </div>

        {/* Content */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-foreground">{current.title}</h1>
          <p className="text-muted-foreground leading-relaxed">{current.description}</p>
        </div>

        {/* Action */}
        <Button
          onClick={() => isLast ? handleComplete() : setStep(step + 1)}
          className="px-8"
          size="lg"
        >
          {isLast ? 'Explore My Map' : 'Next'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default OnboardingPage;
