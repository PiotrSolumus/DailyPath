import { User, Calendar } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Button } from "../ui/button";

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  plan_filled_percent: number;
  active_tasks: number;
}

interface TeamMemberCardProps {
  member: TeamMember;
  onViewPlan: (memberId: string) => void;
}

export function TeamMemberCard({ member, onViewPlan }: TeamMemberCardProps) {
  const planFillColor =
    member.plan_filled_percent >= 70
      ? "text-green-600"
      : member.plan_filled_percent >= 50
        ? "text-yellow-600"
        : "text-red-600";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{member.full_name}</CardTitle>
              <CardDescription>{member.email}</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Plan wypełnienia:</dt>
            <dd className={`font-semibold ${planFillColor}`}>{member.plan_filled_percent}%</dd>
          </div>

          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Aktywne zadania:</dt>
            <dd className="font-medium">{member.active_tasks}</dd>
          </div>
        </dl>

        <Button variant="outline" className="mt-4 w-full" onClick={() => onViewPlan(member.id)}>
          <Calendar className="mr-2 h-4 w-4" />
          Zobacz plan
        </Button>
      </CardContent>
    </Card>
  );
}
