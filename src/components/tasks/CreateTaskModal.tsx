import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { CreateTaskForm } from "./CreateTaskForm";

/**
 * CreateTaskModal component - modal dialog for creating new tasks
 * 
 * Provides:
 * - Trigger button with Plus icon
 * - Dialog/modal with CreateTaskForm
 * - Auto-close on successful creation
 * - Cancel functionality
 * 
 * @example
 * ```tsx
 * <CreateTaskModal />
 * ```
 */
export function CreateTaskModal() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nowe zadanie
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <CreateTaskForm onSuccess={() => setOpen(false)} onCancel={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

