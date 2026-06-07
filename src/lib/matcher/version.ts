// 제목에서 버전 부류를 판정하고 비교한다. 순수 함수.
// 입력은 normalizer로 정규화된(소문자, 괄호 통일) 제목을 가정한다.
// 미표기·(original mix)는 모두 "original" 부류로 본다.

// 우선순위 순서대로 매칭 — 먼저 걸리는 키워드가 부류를 결정한다.
const VERSION_CLASS_RULES: ReadonlyArray<readonly [string, string]> = [
  ["remix", "remix"],
  ["bootleg", "remix"],
  ["rework", "remix"],
  ["mashup", "remix"],
  ["vip", "remix"],
  ["extended", "extended"],
  ["club", "extended"],
  ["instrumental", "instrumental"],
  ["acapella", "acapella"],
  ["dub", "dub"],
  ["radio", "radio"],
  ["edit", "edit"],
  ["original", "original"],
];

const PAREN_PATTERN = /\(([^)]*)\)/g;

// 제목 안 모든 괄호 절을 모아 하나의 문자열로.
function parenContent(normalizedTitle: string): string {
  const segments: string[] = [];
  const re = new RegExp(PAREN_PATTERN);
  let m: RegExpExecArray | null;
  while ((m = re.exec(normalizedTitle)) !== null) segments.push(m[1]);
  return segments.join(" ");
}

export function versionClass(normalizedTitle: string): string {
  const content = parenContent(normalizedTitle);
  for (const [keyword, cls] of VERSION_CLASS_RULES) {
    if (content.includes(keyword)) return cls;
  }
  return "original";
}

export function versionsMatch(a: string, b: string): boolean {
  return versionClass(a) === versionClass(b);
}
