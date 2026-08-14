/* @refresh reload */
import { render } from 'solid-js/web';

import './index.css';
import Login from './components/Login';
import { ToastProvider, initErrorInterceptor } from './components/ToastContext';

// Initialize early to catch any initialization errors
initErrorInterceptor();

const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
  );
}

render(
  () => (
    <ToastProvider>
      <Login />
    </ToastProvider>
  ),
  root!
);

