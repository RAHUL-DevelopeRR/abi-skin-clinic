import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/outfit'
import '@fontsource-variable/plus-jakarta-sans'
import './index.css'
import App from './App.jsx'

// The build prerenders the public page into #root (scripts/prerender.js) so crawlers and the
// first paint get real content. The app renders from scratch instead of hydrating it, which
// keeps /admin and per-visitor state (review links, #track, today's date) out of hydration.
const root = document.getElementById('root')
root.textContent = ''
document.documentElement.classList.remove('admin-route')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
