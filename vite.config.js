import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// pdfjs-dist ships its worker as a separate file — Vite needs to treat it
// as a static asset rather than trying to bundle it inline.
export default defineConfig({
  plugins: [react()],
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    exclude: ['pdfjs-dist'],
  },
});
