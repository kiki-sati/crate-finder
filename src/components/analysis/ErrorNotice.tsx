import { Button } from "@/components/ui/Button";

export type ErrorNoticeProps = {
  /** 도메인/서비스 에러 code(덕타이핑으로 추출). 없으면 일반 안내만 표시. */
  code?: string;
  /** 서버/도메인 메시지(폴백 표시). */
  message: string;
  /** 있으면 "다시 시도" 버튼을 노출한다. */
  onRetry?: () => void;
};

// code → 한국어 해결 가이드. AnalysisFlow가 잡는 도메인 에러 code와 1:1.
// (가이드 문구만 두고, 매칭/파싱/외부 API는 절대 호출하지 않는 순수 표현 컴포넌트)
const GUIDES: Record<string, string> = {
  invalid_playlist_url:
    "URL을 확인하세요. youtube.com/playlist?list=... 형식이어야 합니다.",
  playlist_not_found:
    "비공개·삭제된 플레이리스트일 수 있어요. 공개 플레이리스트인지 확인하세요.",
  youtube_quota_exceeded:
    "YouTube API 사용 한도를 초과했어요. 잠시 후 다시 시도하세요.",
  youtube_api_error: "일시적 오류일 수 있어요. 잠시 후 다시 시도하세요.",
  missing_url: "플레이리스트 URL을 입력하세요.",
  invalid_extension: "Rekordbox에서 내보낸 .xml 파일을 선택하세요.",
  empty_file: "빈 파일이에요. 올바른 XML을 선택하세요.",
  file_too_large: "최대 20MB까지 올릴 수 있어요. 파일 크기를 확인하세요.",
  missing_file: "파일을 선택하세요.",
  rekordbox_error:
    "XML을 읽지 못했어요. Rekordbox에서 컬렉션을 다시 내보내 보세요.",
};

export function ErrorNotice({ code, message, onRetry }: ErrorNoticeProps) {
  const guide = code ? GUIDES[code] : undefined;

  return (
    <div
      role="alert"
      className="border-2 border-strong bg-[color:var(--color-danger-bg)] px-3 py-2 text-[color:var(--color-danger)]"
    >
      <p className="text-sm font-semibold">{message}</p>
      {guide && (
        <p className="mt-1 text-xs text-[color:var(--color-danger)]">{guide}</p>
      )}
      {onRetry && (
        <div className="mt-2">
          <Button type="button" variant="secondary" onClick={onRetry}>
            다시 시도
          </Button>
        </div>
      )}
    </div>
  );
}
