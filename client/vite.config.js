import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// No proxy on purpose: the server allows this origin with CORS.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
});