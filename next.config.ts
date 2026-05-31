import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

const nextConfig: NextConfig = {
  // 홈 디렉토리의 떠돌이 lockfile(~/package-lock.json)로 인해 Next가
  // 워크스페이스 루트를 잘못 추론하는 문제 방지. 이 프로젝트 디렉토리로 고정한다.
  outputFileTracingRoot: fileURLToPath(new URL(".", import.meta.url)),
};

export default nextConfig;
