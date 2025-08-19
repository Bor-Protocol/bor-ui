import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: [],
  },
  // SECURITY FIX: Only include essential polyfills for WebSocket functionality
  resolve: {
    alias: {
      // Only include polyfills that are actually needed by dependencies
      process: 'process/browser',
    },
  },
  define: {
    'process.env': {},
    // Add minimal global polyfills for WebSocket libraries if needed
    global: 'globalThis',
  },
});
