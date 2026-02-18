
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

console.log('InstaPrep Studio: Starting render...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Critical: Could not find root element");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log('InstaPrep Studio: Render successful');
  } catch (err) {
    console.error('Render error:', err);
  }
}
