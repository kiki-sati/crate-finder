import Link from "next/link";

export function TopMenuBar() {
  return (
    <div className="flex h-9 items-center gap-4 border-b-2 border-strong bg-panel px-3 text-sm font-bold">
      <span>Crate Finder</span>
      <nav className="flex gap-3 font-normal">
        <Link href="/" className="hover:underline">
          New Analysis
        </Link>
        <Link href="/history" className="hover:underline">
          History
        </Link>
      </nav>
    </div>
  );
}
