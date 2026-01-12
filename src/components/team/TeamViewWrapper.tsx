import { AppProviders } from "../../lib/contexts/AppProviders";
import { TeamView } from "./TeamView";
import type { UserMeDTO } from "../../types";

interface TeamViewWrapperProps {
  departmentId: string;
  onViewMemberPlan: (memberId: string, memberName: string) => void;
  initialUser?: UserMeDTO | null;
}

export function TeamViewWrapper({ departmentId, onViewMemberPlan, initialUser }: TeamViewWrapperProps) {
  return (
    <AppProviders initialUser={initialUser}>
      <TeamView departmentId={departmentId} onViewMemberPlan={onViewMemberPlan} />
    </AppProviders>
  );
}
