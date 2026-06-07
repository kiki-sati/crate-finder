"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PlaylistUrlForm } from "@/components/playlist/PlaylistUrlForm";
import { FileUploadBox } from "@/components/rekordbox/FileUploadBox";
import { Button } from "@/components/ui/Button";
import { AppShell } from "@/components/layout/AppShell";
import { WindowPanel } from "@/components/ui/WindowPanel";
import { StepIndicator } from "@/components/analysis/StepIndicator";
import { ErrorNotice } from "@/components/analysis/ErrorNotice";
import { loadPlaylist, parseXml, runMatch } from "@/services/analysis.service";
import { saveAnalysis } from "@/services/analysis-handoff";
import { addSession } from "@/services/analysis-history";
import { takeRerunUrl } from "@/services/rerun-handoff";
import type {
  YouTubePlaylistResponse,
  RekordboxParseResponse,
} from "@/types/api";

export function AnalysisFlow() {
  const router = useRouter();
  const [playlist, setPlaylist] = useState<YouTubePlaylistResponse | null>(null);
  const [library, setLibrary] = useState<RekordboxParseResponse | null>(null);
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [initialUrl, setInitialUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [loadingPlaylist, setLoadingPlaylist] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [matching, setMatching] = useState(false);
  // 오류는 code(가이드 매핑용)·message(폴백)·retry(해당 단계 재시도)를 함께 보관.
  const [error, setError] = useState<{
    code?: string;
    message: string;
    retry?: () => void;
  } | null>(null);

  // "다시 분석"으로 넘어온 URL을 mount 후 1회 프리필(SSR hydration 회피).
  useEffect(() => {
    const url = takeRerunUrl();
    if (url) setInitialUrl(url);
  }, []);

  async function handlePlaylistSubmit(url: string) {
    setError(null);
    setLoadingPlaylist(true);
    try {
      setPlaylist(await loadPlaylist(url));
      setPlaylistUrl(url);
    } catch (e) {
      setError({
        code: (e as { code?: string }).code,
        message:
          e instanceof Error ? e.message : "플레이리스트를 불러오지 못했습니다.",
        retry: () => handlePlaylistSubmit(url),
      });
    } finally {
      setLoadingPlaylist(false);
    }
  }

  async function handleFile(file: File) {
    setError(null);
    setParsing(true);
    try {
      setLibrary(await parseXml(file));
      setFileName(file.name);
    } catch (e) {
      setError({
        code: (e as { code?: string }).code,
        message: e instanceof Error ? e.message : "XML을 파싱하지 못했습니다.",
        retry: () => handleFile(file),
      });
    } finally {
      setParsing(false);
    }
  }

  async function handleRun() {
    if (!playlist || !library) return;
    setError(null);
    setMatching(true);
    try {
      const results = await runMatch(playlist, library);
      saveAnalysis({
        results,
        youtubeTracks: playlist.tracks,
        rekordboxTracks: library.tracks,
      });
      // 요약 지표만 내역에 저장(원본 XML/트랙 미저장, ADR-004).
      addSession({
        playlistUrl,
        playlistId: playlist.playlistId,
        totalTrackCount: results.length,
        ownedCount: results.filter((r) => r.status === "owned").length,
        missingCount: results.filter((r) => r.status === "missing").length,
        reviewCount: results.filter((r) => r.status === "needs_review").length,
      });
      router.push("/results");
    } catch (e) {
      setError({
        code: (e as { code?: string }).code,
        message: e instanceof Error ? e.message : "분석에 실패했습니다.",
        retry: () => handleRun(),
      });
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
            <PlaylistUrlForm
              key={initialUrl}
              defaultUrl={initialUrl}
              onSubmit={handlePlaylistSubmit}
            />
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
            <ErrorNotice
              code={error.code}
              message={error.message}
              onRetry={error.retry}
            />
          )}
        </div>
      </WindowPanel>
    </AppShell>
  );
}
