import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { TeamMemberCard } from "./TeamMemberCard";
import { Input } from "../ui/input";
import { Spinner } from "../ui/spinner";

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  plan_filled_percent: number;
  active_tasks: number;
}

interface TeamViewProps {
  departmentId: string;
  onViewMemberPlan: (memberId: string, memberName: string) => void;
}

async function fetchTeamMembers(departmentId: string): Promise<TeamMember[]> {
  // Mock data - will be replaced with actual API call
  return [
    {
      id: "1",
      full_name: "Jan Kowalski",
      email: "jan.kowalski@example.com",
      plan_filled_percent: 75,
      active_tasks: 8,
    },
    {
      id: "2",
      full_name: "Anna Nowak",
      email: "anna.nowak@example.com",
      plan_filled_percent: 92,
      active_tasks: 12,
    },
    {
      id: "3",
      full_name: "Piotr Wiśniewski",
      email: "piotr.wisniewski@example.com",
      plan_filled_percent: 45,
      active_tasks: 5,
    },
  ];
}

export function TeamView({ departmentId, onViewMemberPlan }: TeamViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewStartTime] = useState(performance.now());

  const { data: members, isLoading } = useQuery({
    queryKey: ["team-members", departmentId],
    queryFn: () => fetchTeamMembers(departmentId),
  });

  // Track manager_view_time when component mounts
  useEffect(() => {
    if (!isLoading && members) {
      const viewTime = performance.now() - viewStartTime;

      // Send analytics event
      fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: "manager_view_render",
          props: {
            duration_ms: Math.round(viewTime),
            team_size: members.length,
          },
        }),
      }).catch(console.error);
    }
  }, [isLoading, members, viewStartTime]);

  const handleViewPlan = (memberId: string) => {
    const member = members?.find((m) => m.id === memberId);
    if (!member) return;

    const planViewStartTime = performance.now();

    // Track specific member plan view time
    onViewMemberPlan(memberId, member.full_name);

    // Send event when plan is opened
    setTimeout(() => {
      const planViewTime = performance.now() - planViewStartTime;

      fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: "manager_view_time",
          props: {
            duration_ms: Math.round(planViewTime),
            target_user_id: memberId,
          },
        }),
      }).catch(console.error);
    }, 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  const filteredMembers = members?.filter(
    (member) =>
      member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Szukaj członka zespołu..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Team grid */}
      {filteredMembers && filteredMembers.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMembers.map((member) => (
            <TeamMemberCard key={member.id} member={member} onViewPlan={handleViewPlan} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-muted p-12 text-center">
          <p className="text-muted-foreground">
            {searchTerm ? "Nie znaleziono członków zespołu" : "Brak członków zespołu"}
          </p>
        </div>
      )}
    </div>
  );
}

