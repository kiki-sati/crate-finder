"use client";
import { useRef } from "react";
import { Button } from "@/components/ui/Button";

export function FileUploadBox({ onFile }: { onFile: (file: File) => void }) {
  // 숨은 file input을 ref로 직접 트리거한다.
  // (label 안에 button을 중첩하면 button이 클릭을 가로채 input으로 전달되지 않음)
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="border-2 border-dashed border-strong bg-panel p-6 text-center text-sm">
      <p className="mb-2">Rekordbox XML 파일을 선택하세요.</p>
      <input
        ref={inputRef}
        type="file"
        accept=".xml"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          // 같은 파일을 다시 선택해도 change가 발생하도록 초기화.
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="secondary"
        onClick={() => inputRef.current?.click()}
      >
        Choose file
      </Button>
      <p className="mt-3 text-xs text-[color:var(--color-text-muted)]">
        원본 XML은 파싱 후 폐기되며 저장되지 않습니다.
      </p>
    </div>
  );
}
