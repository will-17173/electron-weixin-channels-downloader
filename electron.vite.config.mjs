import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import fs from 'fs'

export default defineConfig({
  main: {
    plugins: [
      externalizeDepsPlugin(),
      {
        name: 'copy-decrypt',
        generateBundle() {
          // 复制 decrypt.js 到输出目录
          this.emitFile({
            type: 'asset',
            fileName: 'decrypt.js',
            source: fs.readFileSync(resolve('src/main/decrypt.js'))
          })
        }
      }
    ]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [vue()]
  }
})
