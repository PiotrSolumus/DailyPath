import { Toaster } from "sonner";
import type { ReactNode } from "react";

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          classNames: {
            error: "border-red-500 bg-red-50 text-red-900",
            success: "border-green-500 bg-green-50 text-green-900",
            warning: "border-yellow-500 bg-yellow-50 text-yellow-900",
            info: "border-blue-500 bg-blue-50 text-blue-900",
          },
        }}
        richColors
      />
    </>
  );
}

