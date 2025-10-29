// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'

// --- STYLES ---
// 1. Base Bootstrap (must be first)
import 'bootstrap/dist/css/bootstrap.min.css'; 

// 2. Icons
import '@fortawesome/fontawesome-free/css/all.min.css';

// 3. Your Custom Styles (must be after Bootstrap to override it


// 3. Your Custom Styles (must be after Bootstrap to override it
import './custom-styles.css'; 
// --- END STYLES ---

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)