import type { ReactNode } from "react";
import { TopMenuBar } from "@/components/layout/TopMenuBar";

export function AppShell({
  children,
  statusText = "",
}: {
  children: ReactNode;
  statusText?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-app">
      <TopMenuBar />
      <main className="flex-1 p-6">{children}</main>
      <footer className="border-t-2 border-strong bg-panel px-3 py-1 text-xs text-[color:var(--color-text-muted)]">
        {statusText}
      </footer>
    </div>
  );
}
