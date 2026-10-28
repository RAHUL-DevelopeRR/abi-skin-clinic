import { renderToString } from 'react-dom/server';
import App from './App.jsx';
import { buildLlmsTxt } from './seo/llmsTxt.js';
import { buildStructuredData } from './seo/structuredData.js';

/** Build-time render of the public page, used by scripts/prerender.js. */
export function render() {
  return renderToString(<App />);
}

export { buildLlmsTxt, buildStructuredData };
