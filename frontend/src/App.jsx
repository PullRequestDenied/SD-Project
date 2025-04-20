import { useState } from 'react'
import { UserAuth } from './context/AuthContext'
import LandingPage from './components/LandingPage';
import { DarkModeProvider } from './context/DarkModeContext';

function App() {
  const {session} = UserAuth();
  console.log(session)

  return (
  
      <LandingPage />
    
  );
}

export default App
