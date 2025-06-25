/**
 * @ Author: Levi Agostinho Horta
 * @ Create Time: 2025-06-02 13:23:59
 * @ Modified by: Your name
 * @ Modified time: 2025-06-25 14:34:43
 * @ Description: Shows the App and has all the connections, that get displayed
 * @ Sources: Chatgpt and Claude AI, for Problems and Questions.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

// Find the root DOM element and render the React app into it
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* BrowserRouter enables navigation between different pages without reloading */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
