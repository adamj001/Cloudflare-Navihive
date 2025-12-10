import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cloudflare } from "@cloudflare/vite-plugin";
// 👇 1. 引入 PWA 插件
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    cloudflare(),
    // 👇 2. 配置 PWA
    VitePWA({
      // 自动更新模式：一旦有新版本，用户刷新页面即自动更新，无需点击确认
      registerType: 'autoUpdate',
      
      // 让插件自动把你的 favicon 等资源加入缓存
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'favicon.svg'],
      
      // manifest.json 的配置 (这是浏览器识别 App 的身份证)
      manifest: {
        name: '我的个人导航站', // 安装后显示的完整名称
        short_name: '导航站',   // 主屏幕上显示的短名称
        description: '我的个人专属导航站',
        theme_color: '#ffffff', // 顶部状态栏颜色
        background_color: '#ffffff', // 启动画面背景色
        display: 'standalone', // 关键！设置为 standalone 才会隐藏浏览器地址栏
        icons: [
          {
            src: 'web-app-manifest-192x192.png', // 对应你 public 目录下的文件名
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: web-app-manifest-512x512.png', // 对应你 public 目录下的文件名
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  
  // 👇 之前的打包优化配置保持不变
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'mui-vendor': [
            '@mui/material', 
            '@mui/icons-material', 
            '@emotion/react', 
            '@emotion/styled'
          ],
          'dnd-vendor': [
            '@dnd-kit/core', 
            '@dnd-kit/sortable', 
            '@dnd-kit/utilities'
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1000, 
  },
})
