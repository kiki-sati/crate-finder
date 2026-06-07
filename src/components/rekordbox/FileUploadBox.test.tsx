import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FileUploadBox } from "@/components/rekordbox/FileUploadBox";

describe("FileUploadBox", () => {
  // 회귀: label 안에 button을 중첩하면 클릭이 input으로 전달되지 않아
  // 파일 선택창이 안 열렸다. 버튼 클릭이 숨은 input.click()을 트리거해야 한다.
  it("'Choose file' 클릭 시 숨은 file input의 click을 트리거한다", async () => {
    const { container } = render(<FileUploadBox onFile={vi.fn()} />);
    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click");

    await userEvent.click(screen.getByRole("button", { name: /choose file/i }));

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("파일을 선택하면 onFile을 해당 파일로 호출한다", async () => {
    const onFile = vi.fn();
    const { container } = render(<FileUploadBox onFile={onFile} />);
    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File(["<DJ_PLAYLISTS/>"], "library.xml", {
      type: "text/xml",
    });

    await userEvent.upload(input, file);

    expect(onFile).toHaveBeenCalledTimes(1);
    expect(onFile).toHaveBeenCalledWith(file);
  });
});
