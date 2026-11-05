import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import { installAlbertaTime } from '@/lib/abTimeSetup'
import '@/index.css'

// Every clock in the app reads Alberta time, whatever the device is set to.
installAlbertaTime()

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)