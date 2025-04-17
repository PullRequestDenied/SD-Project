import { useState } from 'react'
import { UserAuth } from './context/AuthContext'

function App() {
  const {session} = UserAuth();
  console.log(session)

  return (
    <div>
      <p>Landing Page</p>

    </div>
  )
}

export default App
