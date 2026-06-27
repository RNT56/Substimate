import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
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
