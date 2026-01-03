import { AppProviders } from "../../lib/contexts/AppProviders";
import { OnboardingWizard } from "./OnboardingWizard";

export function OnboardingWizardWrapper() {
  return (
    <AppProviders>
      <OnboardingWizard />
    </AppProviders>
  );
}

