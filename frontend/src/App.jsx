import { useState } from 'react'
import { UserAuth } from './context/AuthContext'

function App() {
  const {session} = UserAuth();
  console.log(session)

  return (
    <>
      <p>Landing Page</p>
    </>
  )
}

export default App
