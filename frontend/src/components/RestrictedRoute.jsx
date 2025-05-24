import React from 'react'
import { UserAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom';

const RestrictedRoute = ({children}) => {
    const {session,loading} = UserAuth();

    if (loading) return <div>Loading</div>;
  return (
    <>
      {session? <Navigate to="/"/> : <>{children}</> }
    </>
  )
}

export default RestrictedRoute