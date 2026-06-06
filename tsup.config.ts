import { defineConfig } from 'tsup';

export default defineConfig({
  // index.ts에서 공개 export로 연결된 항목만 패키지 산출물에 포함합니다.
  entry: ['src/index.ts'],
  // ESM(import)과 CommonJS(require)를 모두 지원합니다.
  format: ['esm', 'cjs'],
  // TypeScript 사용자와 에디터 자동완성을 위한 declaration 파일을 생성합니다.
  dts: true,
  // Windows 환경에서 dist 파일 잠금으로 인한 EPERM을 줄이기 위해 clean은 끕니다.
  clean: false,
  // 가맹점 연동 디버깅을 위해 sourcemap을 유지합니다.
  sourcemap: true,
  treeshake: true,
});
