import type { ReactNode } from "react";

export function WindowPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-2 border-strong bg-window">
      <header className="border-b-2 border-strong bg-panel px-3 py-1 text-sm font-semibold">
        {title}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}
