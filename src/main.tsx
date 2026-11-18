import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import './index.css';
import { App } from './App';

// HashRouter : les adresses ressemblent à …/#/analyseur, ce qui évite les erreurs 404
// de GitHub Pages quand on recharge une page.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
