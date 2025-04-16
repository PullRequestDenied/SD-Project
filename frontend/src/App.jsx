import { useState } from 'react'
import { UserAuth } from './context/AuthContext'
import LandingPage from './components/LandingPage';

function App() {
  const {session} = UserAuth();
  console.log(session)

  return (
    <LandingPage />
  )
}

export default App
