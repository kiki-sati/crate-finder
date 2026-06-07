import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      // 병렬 트랙(WAT) 워크트리·로컬 도구 산출물은 검사 대상에서 제외.
      // 중첩된 .next/ 빌드 결과가 lint를 오염시키는 것을 방지한다.
      ".claude/**",
    ],
  },
];

export default eslintConfig;
