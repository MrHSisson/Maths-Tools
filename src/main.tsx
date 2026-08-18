import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { syncParkedModeFromUrl } from './parkedMode'
import './index.css'

// Before the first render, so route guards see an up-to-date flag immediately.
syncParkedModeFromUrl()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
