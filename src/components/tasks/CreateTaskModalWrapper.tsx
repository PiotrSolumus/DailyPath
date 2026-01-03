import { AppProviders } from "../../lib/contexts/AppProviders";
import { CreateTaskModal } from "./CreateTaskModal";
import type { UserMeDTO } from "../../types";

interface CreateTaskModalWrapperProps {
  initialUser?: UserMeDTO | null;
}

export function CreateTaskModalWrapper({ initialUser }: CreateTaskModalWrapperProps) {
  return (
    <AppProviders initialUser={initialUser}>
      <CreateTaskModal />
    </AppProviders>
  );
}

