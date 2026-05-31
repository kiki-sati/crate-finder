import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger";
const VARIANT: Record<Variant, string> = {
  primary: "bg-accent text-white",
  secondary: "bg-panel text-[color:var(--color-text-primary)]",
  danger: "bg-[color:var(--color-danger)] text-white danger",
};

export function Button({
  variant = "primary",
  children,
  ...rest
}: { variant?: Variant; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`border-2 border-strong px-4 py-1 text-sm font-semibold disabled:opacity-50 ${VARIANT[variant]}`}
    >
      {children}
    </button>
  );
}
