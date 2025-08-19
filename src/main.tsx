import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// SECURITY FIX: Removed unsafe global window modifications
// Polyfills are now handled securely via Vite configuration

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);