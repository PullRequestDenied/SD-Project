import { useState } from 'react'
import { UserAuth } from './context/AuthContext'
import LandingPage from './components/LandingPage';
import { DarkModeProvider } from './context/DarkModeContext';
function App() {

  return (
    <LandingPage />
  )
}

export default App
