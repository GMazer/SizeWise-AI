
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Truyền API Key từ Netlify Environment Variables vào code lúc build
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});
