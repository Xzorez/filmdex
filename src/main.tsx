import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { markTransitionSupport } from './lib/transition'
import './styles.css'

markTransitionSupport()

const container = document.getElementById('root')
if (!container) throw new Error('No se encontró el contenedor raíz.')

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
)
