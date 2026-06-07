// 문자 bigram Dice 계수 — 두 문자열의 유사도(0~1). 순수 함수.
// 외부/컴포넌트 의존 금지(CLAUDE.md 계층 규칙).

// 사전계산(prepared) bigram 표현.
// counts: bigram → 등장 횟수(중복 포함). size: 총 bigram 수(= s.length-1, 2글자 미만은 0).
// 한 번 만들면 여러 비교에서 읽기 전용으로 공유 재사용한다(diceFromPrepared가 변형하지 않음).
export type PreparedGrams = { counts: Map<string, number>; size: number };

// 문자열의 bigram count Map과 총 bigram 수를 1회 계산.
export function prepareGrams(s: string): PreparedGrams {
  const counts = new Map<string, number>();
  let size = 0;
  for (let i = 0; i < s.length - 1; i++) {
    const g = s.slice(i, i + 2);
    counts.set(g, (counts.get(g) ?? 0) + 1);
    size++;
  }
  return { counts, size };
}

// 사전계산 prepared로 Dice 계수 계산. diceCoefficient(aStr, bStr)와 수학적으로 동일.
// 단락 조건: aStr===bStr → 1, 둘 중 2글자 미만 → 0.
// 교집합은 distinct bigram별 min(countA, countB) 합 (mutate 금지: prepared Map 공유 재사용).
export function diceFromPrepared(
  a: PreparedGrams,
  b: PreparedGrams,
  aStr: string,
  bStr: string,
): number {
  if (aStr === bStr) return 1;
  if (aStr.length < 2 || bStr.length < 2) return 0;

  // 작은 Map을 순회하면 비교 횟수가 줄어든다(결과는 동일).
  const [small, large] =
    a.counts.size <= b.counts.size ? [a.counts, b.counts] : [b.counts, a.counts];

  let intersection = 0;
  for (const [g, cSmall] of small) {
    const cLarge = large.get(g);
    if (cLarge !== undefined) {
      intersection += cSmall < cLarge ? cSmall : cLarge;
    }
  }

  return (2 * intersection) / (a.size + b.size);
}

export function diceCoefficient(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  return diceFromPrepared(prepareGrams(a), prepareGrams(b), a, b);
}
