import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlaylistUrlForm } from "@/components/playlist/PlaylistUrlForm";

describe("PlaylistUrlForm", () => {
  it("입력한 URL로 onSubmit을 호출한다", async () => {
    const onSubmit = vi.fn();
    render(<PlaylistUrlForm onSubmit={onSubmit} />);
    await userEvent.type(
      screen.getByPlaceholderText(/playlist/i),
      "https://youtube.com/playlist?list=PLx",
    );
    await userEvent.click(screen.getByRole("button", { name: /load/i }));
    expect(onSubmit).toHaveBeenCalledWith("https://youtube.com/playlist?list=PLx");
  });

  it("defaultUrl을 입력 초기값으로 채운다", () => {
    render(
      <PlaylistUrlForm onSubmit={() => {}} defaultUrl="https://yt/playlist?list=PL9" />,
    );
    expect(screen.getByPlaceholderText(/playlist/i)).toHaveValue(
      "https://yt/playlist?list=PL9",
    );
  });
});
