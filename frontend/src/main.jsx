import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import './i18n' // Initialize i18n
import App from './App.jsx'

// Ensure all fetch & axios network calls include server session cookies (HttpOnly)
const originalFetch = window.fetch;
window.fetch = function (url, options = {}) {
  options.credentials = options.credentials || 'include';
  return originalFetch(url, options);
};
axios.defaults.withCredentials = true;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
