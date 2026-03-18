import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from './App.jsx'
import './styles/index.css'

// --- Hide Annoying Google Identity / COOP Errors from Console ---
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

const suppressGoogleLogs = (...args) => {
  if (typeof args[0] === 'string' && (
    args[0].includes('[GSI_LOGGER]') || 
    args[0].includes('Cross-Origin-Opener-Policy')
  )) {
    return true; 
  }
  return false;
};

console.error = (...args) => {
  if (!suppressGoogleLogs(...args)) originalConsoleError(...args);
};
console.warn = (...args) => {
  if (!suppressGoogleLogs(...args)) originalConsoleWarn(...args);
};
console.log = (...args) => {
  if (!suppressGoogleLogs(...args)) originalConsoleLog(...args);
};
// ----------------------------------------------------------------

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "825997830315-omuf6s779hpoq8kpal8hk80u28840e81.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
)
