import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('/react-dom/')) return 'vendor-react-dom';
            if (id.includes('/react/')) return 'vendor-react';
            if (id.includes('/react-is/')) return 'vendor-react';
            if (id.includes('/zustand/')) return 'vendor-state';
            if (id.includes('recharts')) return 'vendor-recharts';
            if (id.includes('@supabase/supabase-js')) return 'vendor-supabase';
            if (id.includes('react-router')) return 'vendor-router';
            if (id.includes('lucide-react')) return 'vendor-icons';
            return 'vendor-misc';
          }
        },
      },
    },
  },
})
