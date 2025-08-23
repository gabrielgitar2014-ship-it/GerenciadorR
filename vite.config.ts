import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa' // 1. Importe o plugin

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // 2. Adicione o plugin PWA com as configurações
    VitePWA({
      registerType: 'autoUpdate',
      // Injeta os assets do PWA no build final
      injectRegister: 'auto',
      // Configura o Service Worker
      workbox: {
        // Define os arquivos que serão cacheados para uso offline
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,vue,txt,woff2}']
      },
      // Configura o arquivo de Manifesto (a identidade do seu app)
      manifest: {
        name: 'Meu Gerenciador Financeiro',
        short_name: 'Gerenciador',
        description: 'Uma aplicação para gerenciar suas finanças.',
        theme_color: '#007bff', // Cor da barra de ferramentas do app
        background_color: '#ffffff', // Cor da tela de splash
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})