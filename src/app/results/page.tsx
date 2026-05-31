import { AppShell } from "@/components/layout/AppShell";
import { WindowPanel } from "@/components/ui/WindowPanel";
import { MatchResultTable } from "@/components/results/MatchResultTable";
import { loadMatchRows } from "@/app/results/loader";

export default function ResultsPage() {
  const rows = loadMatchRows();
  return (
    <AppShell statusText={`${rows.length} tracks analyzed`}>
      <WindowPanel title="Match Results">
        <MatchResultTable rows={rows} />
      </WindowPanel>
    </AppShell>
  );
}
