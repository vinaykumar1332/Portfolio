import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import seoPlugin from './seo.plugin.js'

// https://vite.dev/config/
export default defineConfig({
  // Relative base keeps the build portable (custom domain vinaytech.space, sub-paths or local preview)
  base: './',
  plugins: [react(), seoPlugin()],
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        // React rarely changes, so it gets its own long-cached chunk. Motion is
        // left to the bundler so its lazy features (src/lib/motionFeatures.js)
        // split out of the critical path.
        manualChunks(id) {
          if (/node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react'
        },
      },
    },
  },
})
