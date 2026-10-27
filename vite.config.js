import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Absolute asset paths: with './', /admin/ (trailing slash) loaded /admin/assets/*.js,
  // which the SPA fallback answers with HTML, leaving a blank page.
  base: '/',
  plugins: [react(), tailwindcss()],
})
