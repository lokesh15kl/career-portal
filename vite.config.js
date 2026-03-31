import net from 'node:net'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function canConnect(url, timeoutMs = 350) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url)
      const port = Number(parsed.port || (parsed.protocol === 'https:' ? 443 : 80))
      const host = parsed.hostname

      const socket = net.createConnection({ host, port })
      let done = false

      const finish = (result) => {
        if (done) return
        done = true
        socket.destroy()
        resolve(result)
      }

      socket.setTimeout(timeoutMs)
      socket.on('connect', () => finish(true))
      socket.on('timeout', () => finish(false))
      socket.on('error', () => finish(false))
    } catch {
      resolve(false)
    }
  })
}

async function resolveBackendTarget({ command, env }) {
  const explicit = String(env.VITE_BACKEND_PROXY_TARGET || env.VITE_API_BASE_URL || '').trim()
  if (explicit) return explicit

  // Avoid probing during production builds where proxy is unused.
  if (command !== 'serve') return 'http://localhost:8080'

  const candidates = ['http://localhost:8080', 'http://localhost:8081']
  for (const candidate of candidates) {
    // Pick the first reachable local backend.
    // eslint-disable-next-line no-await-in-loop
    if (await canConnect(candidate)) return candidate
  }

  return 'http://localhost:8080'
}

// https://vite.dev/config/
export default defineConfig(async ({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendTarget = await resolveBackendTarget({ command, env });

  return {
    base: mode === 'production' ? "/career-portal/" : "/",

    plugins: [react()],

    server: {
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/admin/saveManualQuiz': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/admin/manualQuiz': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/sendOtp': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/verifyOtp': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/doLogin': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/generate-quiz': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/legacy': {
          target: backendTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/legacy/, ''),
        },
        '/css/': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/logout': {
          target: backendTarget,
          changeOrigin: true,
        },
      },
    },
  };
})