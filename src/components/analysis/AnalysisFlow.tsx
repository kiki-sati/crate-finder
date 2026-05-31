"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlaylistUrlForm } from "@/components/playlist/PlaylistUrlForm";
import { FileUploadBox } from "@/components/rekordbox/FileUploadBox";
import { Button } from "@/components/ui/Button";
import { AppShell } from "@/components/layout/AppShell";
import { WindowPanel } from "@/components/ui/WindowPanel";
import { StepIndicator } from "@/components/analysis/StepIndicator";
import { loadPlaylist, parseXml, runMatch } from "@/services/analysis.service";
import type {
  YouTubePlaylistResponse,
  RekordboxParseResponse,
} from "@/types/api";

export function AnalysisFlow() {
  const router = useRouter();
  const [playlist, setPlaylist] = useState<YouTubePlaylistResponse | null>(null);
  const [library, setLibrary] = useState<RekordboxParseResponse | null>(null);
  const [fileName, setFileName] = useState("");
  const [loadingPlaylist, setLoadingPlaylist] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [matching, setMatching] = useState(false);
  const [error, setError] = useState("");

  async function handlePlaylistSubmit(url: string) {
    setError("");
    setLoadingPlaylist(true);
    try {
      setPlaylist(await loadPlaylist(url));
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "플레이리스트를 불러오지 못했습니다.",
      );
    } finally {
      setLoadingPlaylist(false);
    }
  }

  async function handleFile(file: File) {
    setError("");
    setParsing(true);
    try {
      setLibrary(await parseXml(file));
      setFileName(file.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "XML을 파싱하지 못했습니다.");
    } finally {
      setParsing(false);
    }
  }

  async function handleRun() {
    if (!playlist || !library) return;
    setError("");
    setMatching(true);
    try {
      await runMatch(playlist, library);
      router.push("/results");
    } catch (e) {
      setError(e instanceof Error ? e.message : "분석에 실패했습니다.");
      setMatching(false);
    }
  }

  const ready = playlist !== null && library !== null;
  const currentStep = !playlist ? 1 : !library ? 2 : 3;

  return (
    <AppShell statusText={matching ? "분석 중…" : "새 분석"}>
      <WindowPanel title="New Analysis">
        <StepIndicator current={currentStep} />

        <div className="mt-4 flex flex-col gap-6">
          <section>
            <h2 className="mb-2 text-sm font-semibold">1. 플레이리스트 불러오기</h2>
            <PlaylistUrlForm onSubmit={handlePlaylistSubmit} />
            {loadingPlaylist && <p className="mt-2 text-xs">불러오는 중…</p>}
            {playlist && (
              <p className="mt-2 text-xs text-[color:var(--color-text-muted)]">
                {playlist.tracks.length}곡 로드됨
              </p>
            )}
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold">2. Rekordbox XML 업로드</h2>
            <FileUploadBox onFile={handleFile} />
            {parsing && <p className="mt-2 text-xs">파싱 중…</p>}
            {library && (
              <p className="mt-2 text-xs text-[color:var(--color-text-muted)]">
                {fileName} — {library.trackCount}곡 파싱됨
              </p>
            )}
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold">3. 분석 실행</h2>
            <Button type="button" onClick={handleRun} disabled={!ready || matching}>
              {matching ? "분석 중…" : "Run Match"}
            </Button>
          </section>

          {error && (
            <p role="alert" className="text-sm text-[color:var(--color-danger)]">
              {error}
            </p>
          )}
        </div>
      </WindowPanel>
    </AppShell>
  );
}
