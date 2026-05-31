// 문자 bigram Dice 계수 — 두 문자열의 유사도(0~1). 순수 함수.
// 외부/컴포넌트 의존 금지(CLAUDE.md 계층 규칙).

function bigrams(s: string): string[] {
  const grams: string[] = [];
  for (let i = 0; i < s.length - 1; i++) grams.push(s.slice(i, i + 2));
  return grams;
}

export function diceCoefficient(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;

  const aGrams = bigrams(a);
  const bGrams = bigrams(b);

  const bCounts = new Map<string, number>();
  for (const g of bGrams) bCounts.set(g, (bCounts.get(g) ?? 0) + 1);

  let intersection = 0;
  for (const g of aGrams) {
    const c = bCounts.get(g) ?? 0;
    if (c > 0) {
      intersection++;
      bCounts.set(g, c - 1);
    }
  }

  return (2 * intersection) / (aGrams.length + bGrams.length);
}
