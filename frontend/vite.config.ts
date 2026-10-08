import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: '127.0.0.1',
    port: Number(process.env.PNEUMONIA_WEB_PORT ?? 5174),
    strictPort: true,
    proxy: Object.fromEntries(
      ['/predict', '/health', '/docs', '/openapi.json', '/swagger-ui'].map((path) => [
        path,
        {
          target: `http://127.0.0.1:${process.env.PNEUMONIA_API_PORT ?? 8001}`,
          changeOrigin: true,
        },
      ]),
    ),
  },
})
