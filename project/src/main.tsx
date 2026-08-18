import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Polyfill: framer-motion v12 wraps the native performance API;
// if clearMarks/clearMeasures are absent it throws "mgt.clearMarks is not a function"
if (typeof performance !== 'undefined') {
  if (typeof (performance as Performance).clearMarks !== 'function') {
    (performance as any).clearMarks = (_name?: string) => {};
  }
  if (typeof (performance as Performance).clearMeasures !== 'function') {
    (performance as any).clearMeasures = (_name?: string) => {};
  }
  if (typeof (performance as Performance).mark !== 'function') {
    (performance as any).mark = (_name: string) => {};
  }
  if (typeof (performance as Performance).measure !== 'function') {
    (performance as any).measure = (_name: string) => {};
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
