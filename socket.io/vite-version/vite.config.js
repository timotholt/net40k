import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3002',
        ws: true
      }
    }
  }
})
