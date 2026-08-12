import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';

window.addEventListener('error', (e) => {
  fetch('/api/health?error=' + encodeURIComponent(e.error?.stack || e.message));
});
window.addEventListener('unhandledrejection', (e) => {
  fetch('/api/health?promise=' + encodeURIComponent(e.reason?.stack || e.reason));
});
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
