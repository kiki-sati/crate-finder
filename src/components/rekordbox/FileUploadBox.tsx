"use client";
import { Button } from "@/components/ui/Button";

export function FileUploadBox({ onFile }: { onFile: (file: File) => void }) {
  return (
    <div className="border-2 border-dashed border-strong bg-panel p-6 text-center text-sm">
      <p className="mb-2">Rekordbox XML 파일을 선택하세요.</p>
      <label>
        <input
          type="file"
          accept=".xml"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />
        <Button type="button" variant="secondary">
          Choose file
        </Button>
      </label>
      <p className="mt-3 text-xs text-[color:var(--color-text-muted)]">
        원본 XML은 파싱 후 폐기되며 저장되지 않습니다.
      </p>
    </div>
  );
}
