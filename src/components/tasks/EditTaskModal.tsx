import { Dialog, DialogContent } from "../ui/dialog";
import { EditTaskForm } from "./EditTaskForm";
import type { TaskDTO } from "../../types";

interface EditTaskModalProps {
  /** Task to edit */
  task: TaskDTO | null;
  /** Whether the modal is open */
  open: boolean;
  /** Callback to change open state */
  onOpenChange: (open: boolean) => void;
}

/**
 * EditTaskModal component - modal dialog for editing tasks
 * 
 * Provides:
 * - Dialog/modal with EditTaskForm
 * - Auto-close on successful update
 * - Cancel functionality
 * 
 * @example
 * ```tsx
 * <EditTaskModal 
 *   task={selectedTask}
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 * />
 * ```
 */
export function EditTaskModal({ task, open, onOpenChange }: EditTaskModalProps) {
  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <EditTaskForm 
          task={task}
          onSuccess={() => onOpenChange(false)} 
          onCancel={() => onOpenChange(false)} 
        />
      </DialogContent>
    </Dialog>
  );
}


