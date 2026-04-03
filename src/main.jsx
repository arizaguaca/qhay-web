import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// ─── Dependency Injection ────────────────────────────────────────────────────
// Repositories are instantiated here (the composition root) and injected into
// the App. This keeps the presentation layer decoupled from the data layer,
// making it trivial to swap implementations (e.g. mock repos for testing).
import { authRepository } from './data/repositories/authRepository';
import { restaurantRepository } from './data/repositories/restaurantRepository';
// ─────────────────────────────────────────────────────────────────────────────

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App
      authRepository={authRepository}
      restaurantRepository={restaurantRepository}
    />
  </StrictMode>
);
