"use client";
import { useCallback, useEffect, useState } from "react";
import { searchPrices } from "@/services/price.service";
import type { PriceQuote } from "@/types/pricing";

type Props = { title: string; artist?: string };

export function PriceComparePanel({ title, artist }: Props) {
  const [offers, setOffers] = useState<PriceQuote[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await searchPrices({ title, artist });
      setOffers(res.offers);
    } catch (e) {
      setError(e instanceof Error ? e.message : "가격 조회에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [title, artist]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <p className="p-3 text-xs">가격 불러오는 중…</p>;

  if (error) {
    return (
      <div className="flex flex-col items-start gap-2 p-3">
        <p role="alert" className="text-xs text-[color:var(--color-danger)]">
          {error}
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className="text-xs underline"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!offers || offers.length === 0) {
    return (
      <p className="p-3 text-xs text-[color:var(--color-text-muted)]">
        구매 링크를 찾지 못했습니다.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1 p-3">
      {offers.map((o) => (
        <li key={o.site} className="flex items-center gap-2 text-xs">
          <a
            href={o.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {o.site}
          </a>
          {o.price !== undefined && (
            <span className="text-[color:var(--color-text-secondary)]">
              {o.currency ? `${o.currency} ` : ""}
              {o.price.toFixed(2)}
            </span>
          )}
          {o.isLowest && (
            <span
              aria-label="최저가"
              className="font-semibold text-[color:var(--color-owned)]"
            >
              최저가
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
