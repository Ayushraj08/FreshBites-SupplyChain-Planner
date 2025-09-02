import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,       // default Vite dev port
    open: true,       // auto-open browser on npm run dev
    proxy: {
      // ✅ Proxy API requests to Flask backend
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
})
