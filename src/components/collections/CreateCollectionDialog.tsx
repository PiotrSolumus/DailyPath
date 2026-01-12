import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Spinner } from "../ui/spinner";

interface CreateCollectionDialogProps {
  onSuccess?: () => void;
}

interface CollectionFormData {
  name: string;
  description: string;
}

/**
 * CreateCollectionDialog component - modal dialog for creating new collections
 *
 * Provides:
 * - Trigger button with Plus icon
 * - Dialog/modal with collection form
 * - Auto-close on successful creation
 * - Cancel functionality
 * - Full data-test-id attributes for E2E testing
 *
 * @example
 * ```tsx
 * <CreateCollectionDialog onSuccess={() => console.log('Collection created')} />
 * ```
 */
export function CreateCollectionDialog({ onSuccess }: CreateCollectionDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<CollectionFormData>({
    name: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // TODO: Replace with actual API call
      // await createCollection(formData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Reset form and close dialog
      setFormData({ name: "", description: "" });
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się utworzyć kolekcji");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: "", description: "" });
    setError(null);
    setOpen(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form when dialog closes
      setFormData({ name: "", description: "" });
      setError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button data-test-id="collection-create-button">
          <Plus className="mr-2 h-4 w-4" />
          Nowa kolekcja
        </Button>
      </DialogTrigger>
      <DialogContent data-test-id="collection-dialog">
        <div data-test-id="collection-dialog-wrapper">
          <DialogHeader>
            <DialogTitle data-test-id="collection-dialog-title">Utwórz nową kolekcję</DialogTitle>
            <DialogDescription data-test-id="collection-dialog-description">
              Wypełnij poniższe pola, aby utworzyć nową kolekcję.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} data-test-id="collection-form">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="collection-name" data-test-id="collection-name-label">
                Nazwa kolekcji
              </Label>
              <Input
                id="collection-name"
                type="text"
                required
                data-test-id="collection-name-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="np. Moje zadania, Projekt X"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="collection-description" data-test-id="collection-description-label">
                Opis (opcjonalnie)
              </Label>
              <Input
                id="collection-description"
                type="text"
                data-test-id="collection-description-input"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Krótki opis kolekcji"
              />
            </div>

            {error && (
              <div
                className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
                data-test-id="collection-error-message"
              >
                {error}
              </div>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={handleCancel} data-test-id="collection-cancel-button">
              Anuluj
            </Button>
            <Button type="submit" disabled={isSubmitting} data-test-id="collection-save-button">
              {isSubmitting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Zapisywanie...
                </>
              ) : (
                "Zapisz kolekcję"
              )}
            </Button>
          </DialogFooter>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
