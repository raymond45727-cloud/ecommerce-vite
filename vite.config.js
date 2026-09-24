import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  base: '/ecommerce-vite/',
  plugins: [
    vue(),
    {
      name: 'github-pages-spa-fallback',
      closeBundle() {
        copyFileSync(resolve('dist/index.html'), resolve('dist/404.html'))
      },
    },
  ],
})
