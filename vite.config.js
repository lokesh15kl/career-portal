import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/admin/saveManualQuiz': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/admin/manualQuiz': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/sendOtp': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/verifyOtp': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/doLogin': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/generate-quiz': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/legacy': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/legacy/, ''),
      },
      '/css/': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/logout': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
