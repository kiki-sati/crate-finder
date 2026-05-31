"use client";
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function PlaylistUrlForm({ onSubmit }: { onSubmit: (url: string) => void }) {
  const [url, setUrl] = useState("");
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(url);
      }}
    >
      <Input
        placeholder="YouTube playlist URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <Button type="submit">Load</Button>
    </form>
  );
}
