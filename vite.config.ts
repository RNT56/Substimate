import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-sankey')) {
            return 'charts';
          }

          if (id.includes('node_modules/@supabase')) {
            return 'supabase';
          }

          if (id.includes('node_modules/@dnd-kit')) {
            return 'dnd';
          }
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
