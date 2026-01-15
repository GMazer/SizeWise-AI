
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load các biến môi trường từ file .env (nếu chạy local) hoặc từ hệ thống (Netlify)
  // Tham số thứ 3 là '' để load tất cả các biến, không chỉ biến bắt đầu bằng VITE_
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Polyfill object process.env để code client không bị lỗi khi truy cập process.env
      'process.env': {},
      // Gán giá trị cụ thể cho API_KEY từ env (local) hoặc process.env (Netlify)
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY || "")
    }
  };
});
