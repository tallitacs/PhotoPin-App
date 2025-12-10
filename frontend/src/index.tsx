import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './hooks/useTheme';
import { AuthProvider } from './hooks/useAuth';
import { ErrorBoundary } from './components/Common/ErrorBoundary';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// Get root element for React rendering
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Render app with providers (ErrorBoundary, ThemeProvider, BrowserRouter, AuthProvider)
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

// Register service worker for PWA functionality
serviceWorkerRegistration.register({
  onUpdate: (registration) => {
    // Handle service worker update
    if (registration && registration.waiting) {
      // Prompt user to reload for new version
      if (window.confirm('New version available! Reload to update?')) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    }
  },
  onSuccess: (registration) => {
    console.log('Service Worker registered successfully:', registration);
  },
});