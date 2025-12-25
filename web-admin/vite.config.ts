import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    // 청크 분할 없이 단일 파일로 빌드
    cssCodeSplit: false,
    assetsInlineLimit: 100000000, // 모든 에셋을 인라인
    // ✅ 압축 비활성화 - 가독성 유지
    minify: false,
    rollupOptions: {
      output: {
        // 단일 청크로 번들
        inlineDynamicImports: true,
      },
    },
  },
})
