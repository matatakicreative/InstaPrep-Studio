
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

console.log('--- InstaPrep Studio Bootstrapping ---');

const mountNode = document.getElementById('root');

if (!mountNode) {
  console.error('Critical Error: #root element not found in DOM.');
} else {
  try {
    const root = ReactDOM.createRoot(mountNode);
    root.render(<App />);
    console.log('App successfully mounted.');
  } catch (error) {
    console.error('Failed to render React application:', error);
  }
}
