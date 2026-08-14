import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import pkg from './package.json' with { type: 'json' }

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_DEV_PROXY_TARGET || 'http://localhost:3000'

  return {
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[hash].js',
          chunkFileNames: 'assets/[hash].js',
          assetFileNames: 'assets/[hash].[ext]',
          
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return undefined
            }
            if (id.includes('node_modules/framer-motion') || id.includes('node_modules/motion-dom') || id.includes('node_modules/motion-utils')) {
              return 'framer-motion'
            }
            if (
              id.includes('node_modules/@nextui-org') ||
              id.includes('node_modules/@react-aria') ||
              id.includes('node_modules/@react-stately') ||
              id.includes('node_modules/@react-types') ||
              id.includes('node_modules/@internationalized') ||
              id.includes('node_modules/@swc/helpers') ||
              id.includes('node_modules/@tanstack/react-virtual') ||
              id.includes('node_modules/aria-hidden') ||
              id.includes('node_modules/react-remove-scroll') ||
              id.includes('node_modules/tailwind-variants') ||
              id.includes('node_modules/tailwind-merge')
            ) {
              return 'nextui'
            }
            if (id.includes('node_modules/react-slick') || id.includes('node_modules/slick-carousel')) {
              return 'slick'
            }
            if (id.includes('node_modules/socket.io-client') || id.includes('node_modules/engine.io-client') || id.includes('node_modules/socket.io-parser')) {
              return 'socket-io'
            }
            if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next')) {
              return 'i18n'
            }
            if (
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react-router') ||
              id.includes('node_modules/react/') ||
              id.includes('node_modules/scheduler/') ||
              id.includes('node_modules/react-is/')
            ) {
              return 'react-vendor'
            }
            return undefined
          },
        },
      },
    },
    server: {
      port: 3456,
      proxy: {
        '/game/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
        '/hall/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
        '/ws/internal': {
          target: proxyTarget,
          changeOrigin: true,
          ws: true,
        },
        '/uploads': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
