// YouTube 파싱/연동 도메인 에러 — code는 ApiErr.error.code로 그대로 노출 가능.
// 보안: 메시지/code에 API Key·키 포함 URL·로컬 경로를 절대 담지 않는다(CLAUDE.md §보안).
export class InvalidPlaylistUrlError extends Error {
  readonly code = "invalid_playlist_url";
  constructor(message = "유효한 YouTube 플레이리스트 URL이 아닙니다.") {
    super(message);
    this.name = "InvalidPlaylistUrlError";
  }
}

// HTTP 404 또는 빈 응답 — 비공개/삭제/존재하지 않는 플레이리스트.
export class PlaylistNotFoundError extends Error {
  readonly code = "playlist_not_found";
  constructor(
    message = "플레이리스트를 찾을 수 없습니다. 비공개이거나 삭제되었을 수 있습니다.",
  ) {
    super(message);
    this.name = "PlaylistNotFoundError";
  }
}

// HTTP 403 — 일일 쿼터 초과 또는 API 키 권한 문제.
export class YouTubeQuotaError extends Error {
  readonly code = "youtube_quota_exceeded";
  constructor(
    message = "YouTube API 사용 한도를 초과했거나 접근 권한이 없습니다. 잠시 후 다시 시도해 주세요.",
  ) {
    super(message);
    this.name = "YouTubeQuotaError";
  }
}

// 그 외 HTTP 오류·네트워크 오류 등 일반 실패.
export class YouTubeApiError extends Error {
  readonly code = "youtube_api_error";
  constructor(
    message = "YouTube에서 곡 목록을 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.",
  ) {
    super(message);
    this.name = "YouTubeApiError";
  }
}
