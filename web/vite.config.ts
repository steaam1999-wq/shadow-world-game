import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// `npm run build:single` собирает весь сайт в один index.html (для превью).
// base './': сайт открывается из подпапки на GitHub Pages, поэтому ссылки на файлы относительные.
const BUILD = new Date().toISOString().slice(0, 16).replace('T', ' ')

// version.json — метка свежей сборки: открытая страница сверяет её со своей и сама обновляется.
const versionFile = { name: 'version-file', generateBundle(this: { emitFile: (f: { type: 'asset'; fileName: string; source: string }) => void }) { this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ build: BUILD }) }) } }

export default defineConfig(({ mode }) => ({
  base: './',
  // Метка сборки — уходит в сообщения об ошибках, чтобы понимать, на какой версии случилось.
  define: { __BUILD__: JSON.stringify(BUILD) },
  plugins: [react(), tailwindcss(), versionFile, ...(mode === 'single' ? [viteSingleFile()] : [])],
  // Библиотеки — отдельными файлами: они почти не меняются и остаются в кэше телефона после обновлений сайта.
  build: mode === 'single' ? { outDir: 'dist-single' } : {
    rollupOptions: {
      output: {
        manualChunks: (id: string) => (/node_modules\/(react|react-dom|scheduler)\//.test(id) ? 'react' : /node_modules\/@supabase\//.test(id) ? 'supabase' : undefined),
      },
    },
  },
}))
