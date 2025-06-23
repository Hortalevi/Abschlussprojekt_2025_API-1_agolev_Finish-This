/**
 * @ Author: Levi Agostinho Horta
 * @ Create Time: 2025-06-02 13:23:59
 * @ Modified by: Your name
 * @ Modified time: 2025-06-23 16:36:19
 * @ Description: Shows the App and has all the connections, that get displayed
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
