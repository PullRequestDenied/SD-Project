import React from 'react'
import { UserAuth } from '../context/AuthContext'

const ResetPassword = () => {

    const {session} = UserAuth();

  return (
    <div>ResetPassword</div>
  )
}

export default ResetPassword