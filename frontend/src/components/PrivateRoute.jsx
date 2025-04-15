import React from 'react'
import { UserAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({children}) => {
    const {session} = UserAuth();
    console.log(session)

  return (<>{session ? <>{children}</> : <Navigate to="/signin"/>}</>)
}

export default PrivateRoute