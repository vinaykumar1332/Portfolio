import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import seoPlugin from './seo.plugin.js'

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the build works on GitHub Pages sub-paths (e.g. /Hyper-portfolio/)
  base: './',
  plugins: [react(), seoPlugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/motion') || id.includes('node_modules/framer-motion')) return 'motion'
          if (id.includes('node_modules/react')) return 'react'
        },
      },
    },
  },
})
