import { defineConfig } from 'tsup';

export default defineConfig({
  // 빌드 시작점 — index.ts에서 export한 것만 결과물에 포함됨
  entry: ['src/index.ts'],
  // ESM(import)과 CJS(require) 둘 다 지원 → 어떤 프로젝트든 설치 가능
  format: ['esm', 'cjs'],
  // .d.ts 타입 정의 파일 생성 → 외부 팀이 자동완성/타입체크 받음
  dts: true,
  // 빌드 전 dist 폴더 비우기
  clean: true,
  // 소스맵 생성 (디버깅용)
  sourcemap: true,
  // 트리쉐이킹 (안 쓰는 코드 제거)
  treeshake: true,
});
