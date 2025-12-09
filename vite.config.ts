import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cloudflare()],
  
  // 👇 这里是新增的打包优化配置
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 1. 把 React 核心库单独打包（这是基础，几乎不会变）
          'react-vendor': ['react', 'react-dom'],
          
          // 2. 把 Material UI (MUI) 相关的库单独打包
          // MUI 是体积最大的部分，如果不分包，index.js 会非常巨大
          'mui-vendor': [
            '@mui/material', 
            '@mui/icons-material', 
            '@emotion/react', 
            '@emotion/styled'
          ],
          
          // 3. 把新加的拖拽库 dnd-kit 单独打包
          'dnd-vendor': [
            '@dnd-kit/core', 
            '@dnd-kit/sortable', 
            '@dnd-kit/utilities'
          ],
        },
      },
    },
    // 可选：调大警告阈值，避免控制台报 "chunk size limit" 警告（默认是 500kb）
    chunkSizeWarningLimit: 1000, 
  },
})
