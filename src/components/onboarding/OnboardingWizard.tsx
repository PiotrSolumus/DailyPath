import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../ui/card";
import { WorkingHoursStep } from "./steps/WorkingHoursStep";
import { TimezoneStep } from "./steps/TimezoneStep";
import { PreferencesStep } from "./steps/PreferencesStep";
import { toast } from "sonner";

interface OnboardingData {
  workingHours: {
    days: number[];
    startHour: number;
    endHour: number;
  };
  timezone: string;
  preferences: {
    defaultView: "day" | "week";
    notifications: boolean;
  };
}

const STORAGE_KEY = "onboarding_progress";

const defaultData: OnboardingData = {
  workingHours: {
    days: [1, 2, 3, 4, 5], // Mon-Fri
    startHour: 9,
    endHour: 17,
  },
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  preferences: {
    defaultView: "day",
    notifications: true,
  },
};

const steps = [
  {
    id: "working-hours",
    title: "Godziny pracy",
    description: "Skonfiguruj swoje typowe godziny pracy",
  },
  {
    id: "timezone",
    title: "Strefa czasowa",
    description: "Wybierz swoją strefę czasową",
  },
  {
    id: "preferences",
    title: "Preferencje",
    description: "Dostosuj ustawienia aplikacji",
  },
];

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(defaultData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load progress from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setData(parsed.data);
        setCurrentStep(parsed.step);
      } catch (error) {
        console.error("Failed to load onboarding progress:", error);
      }
    }
  }, []);

  // Save progress to localStorage on change
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        step: currentStep,
        data,
      })
    );
  }, [currentStep, data]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Submit working hours
      await fetch("/api/users/me/working-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schedule: data.workingHours.days.map((day) => ({
            weekday: day,
            periods: [`[${data.workingHours.startHour * 60}, ${data.workingHours.endHour * 60})`],
          })),
        }),
      });

      // Update user preferences
      await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timezone: data.timezone,
        }),
      });

      // Clear localStorage
      localStorage.removeItem(STORAGE_KEY);

      toast.success("Konfiguracja zakończona!");

      // Redirect to dashboard
      window.location.href = "/dashboard";
    } catch (error) {
      toast.error("Wystąpił błąd podczas zapisywania konfiguracji");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateData = (partial: Partial<OnboardingData>) => {
    setData({ ...data, ...partial });
  };

  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-1 items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                    index < currentStep
                      ? "border-primary bg-primary text-primary-foreground"
                      : index === currentStep
                        ? "border-primary bg-background text-primary"
                        : "border-muted-foreground/30 bg-background text-muted-foreground"
                  }`}
                >
                  {index < currentStep ? <Check className="h-5 w-5" /> : index + 1}
                </div>

                {index < steps.length - 1 && (
                  <div
                    className={`mx-2 h-0.5 flex-1 transition-colors ${
                      index < currentStep ? "bg-primary" : "bg-muted-foreground/30"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Krok {currentStep + 1} z {steps.length}
            </p>
          </div>
        </div>

        {/* Step content */}
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep].title}</CardTitle>
            <CardDescription>{steps[currentStep].description}</CardDescription>
          </CardHeader>

          <CardContent>
            {currentStep === 0 && (
              <WorkingHoursStep data={data.workingHours} onChange={(wh) => updateData({ workingHours: wh })} />
            )}
            {currentStep === 1 && (
              <TimezoneStep timezone={data.timezone} onChange={(tz) => updateData({ timezone: tz })} />
            )}
            {currentStep === 2 && (
              <PreferencesStep data={data.preferences} onChange={(p) => updateData({ preferences: p })} />
            )}
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Wstecz
            </Button>

            {isLastStep ? (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Zapisywanie..." : "Zakończ"}
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Dalej
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
