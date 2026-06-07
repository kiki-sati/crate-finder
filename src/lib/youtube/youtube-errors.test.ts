import { describe, it, expect } from "vitest";
import {
  InvalidPlaylistUrlError,
  PlaylistNotFoundError,
  YouTubeQuotaError,
  YouTubeApiError,
} from "@/lib/youtube/youtube-errors";

describe("youtube-errors", () => {
  it("각 에러는 식별용 code와 한국어 안내 메시지를 가진다", () => {
    expect(new InvalidPlaylistUrlError().code).toBe("invalid_playlist_url");
    expect(new PlaylistNotFoundError().code).toBe("playlist_not_found");
    expect(new YouTubeQuotaError().code).toBe("youtube_quota_exceeded");
    expect(new YouTubeApiError().code).toBe("youtube_api_error");

    expect(new PlaylistNotFoundError().message).toMatch(/플레이리스트/);
    expect(new YouTubeQuotaError().message).toMatch(/한도|권한/);
    expect(new YouTubeApiError().message).toMatch(/곡 목록|다시 시도/);
  });

  it("Error 인스턴스이며 name이 클래스명과 일치한다", () => {
    expect(new PlaylistNotFoundError()).toBeInstanceOf(Error);
    expect(new YouTubeQuotaError().name).toBe("YouTubeQuotaError");
    expect(new YouTubeApiError().name).toBe("YouTubeApiError");
  });
});
