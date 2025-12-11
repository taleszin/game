import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Remove loading screen after app loads
window.addEventListener('load', () => {
  setTimeout(() => {
    const loading = document.getElementById('loading')
    if (loading) {
      loading.classList.add('fade-out')
      setTimeout(() => loading.remove(), 500)
    }
  }, 500)
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
