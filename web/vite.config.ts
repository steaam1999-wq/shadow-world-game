import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// `npm run build:single` собирает весь сайт в один index.html (для превью).
// base './': сайт открывается из подпапки на GitHub Pages, поэтому ссылки на файлы относительные.
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), tailwindcss(), ...(mode === 'single' ? [viteSingleFile()] : [])],
  // Библиотеки — отдельными файлами: они почти не меняются и остаются в кэше телефона после обновлений сайта.
  build: mode === 'single' ? { outDir: 'dist-single' } : {
    rollupOptions: {
      output: {
        manualChunks: (id: string) => (/node_modules\/(react|react-dom|scheduler)\//.test(id) ? 'react' : /node_modules\/@supabase\//.test(id) ? 'supabase' : undefined),
      },
    },
  },
}))
