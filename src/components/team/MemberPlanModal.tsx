import { X } from "lucide-react";
import { Button } from "../ui/button";
import { PlanView } from "../plan/PlanView";

interface MemberPlanModalProps {
  open: boolean;
  memberId: string;
  memberName: string;
  timezone: string;
  onClose: () => void;
}

export function MemberPlanModal({ open, memberId, memberName, timezone, onClose }: MemberPlanModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />

      <div
        className="relative z-50 h-[90vh] w-[95vw] overflow-hidden rounded-lg border bg-background shadow-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 id="modal-title" className="text-xl font-semibold">
              Plan: {memberName}
            </h2>
            <p className="text-sm text-muted-foreground">Podgląd i edycja planu pracownika</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Zamknij">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="h-[calc(90vh-80px)] overflow-y-auto p-6">
          <PlanView userId={memberId} timezone={timezone} isManagerView={true} />
        </div>
      </div>
    </div>
  );
}

