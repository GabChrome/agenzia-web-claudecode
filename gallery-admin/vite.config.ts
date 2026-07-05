import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In sviluppo l'interfaccia gira su Vite (porta 5173) e inoltra le chiamate
// API al Worker locale avviato con `npm run dev:worker` (porta 8787).
export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist' },
  server: {
    proxy: {
      '/api': 'http://localhost:8787',
      '/files': 'http://localhost:8787',
    },
  },
});
