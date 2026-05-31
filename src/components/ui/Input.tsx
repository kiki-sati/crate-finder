import type { InputHTMLAttributes } from "react";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-10 w-full border border-strong bg-panel px-3 text-sm outline-none focus:border-accent"
    />
  );
}
