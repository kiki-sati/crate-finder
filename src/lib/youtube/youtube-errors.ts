// YouTube 파싱 도메인 에러 — code는 ApiErr.error.code로 그대로 노출 가능.
export class InvalidPlaylistUrlError extends Error {
  readonly code = "invalid_playlist_url";
  constructor(message = "유효한 YouTube 플레이리스트 URL이 아닙니다.") {
    super(message);
    this.name = "InvalidPlaylistUrlError";
  }
}
