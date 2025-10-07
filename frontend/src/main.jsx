import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Set API base URL from environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
window.API_BASE_URL = API_BASE_URL;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);