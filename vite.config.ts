import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  // Vercel veya Cloudflare'de root (/) olarak, GitHub Pages'da ise alt klasör olarak çalışmasını sağlar
  base: (process.env.VERCEL || process.env.CF_PAGES) ? '/' : '/libratechv2/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'firebase/app', 'firebase/firestore', 'html5-qrcode'],
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  }
});
