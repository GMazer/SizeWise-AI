
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Polyfill process.env để tránh lỗi "process is not defined"
    'process.env': {},
    // Truyền API Key từ Netlify Environment Variables, thêm || "" để tránh lỗi undefined
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || "")
  }
});