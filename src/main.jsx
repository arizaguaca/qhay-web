import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// ─── Dependency Injection ────────────────────────────────────────────────────
// Repositories are instantiated here (the composition root) and injected into
// the App and AuthProvider. This keeps the presentation layer decoupled from
// the data layer, making it trivial to swap implementations (e.g. mock repos).
import { authRepository } from './data/repositories/authRepository';
import { restaurantRepository } from './data/repositories/restaurantRepository';
// ─────────────────────────────────────────────────────────────────────────────

import { SocketProvider } from './presentation/context/SocketContext.jsx';
import { AuthProvider } from './presentation/context/AuthContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SocketProvider>
      {/* AuthProvider inyecta authRepository y expone el AuthContext a toda la app */}
      <AuthProvider authRepository={authRepository}>
        <App
          authRepository={authRepository}
          restaurantRepository={restaurantRepository}
        />
      </AuthProvider>
    </SocketProvider>
  </StrictMode>
);

