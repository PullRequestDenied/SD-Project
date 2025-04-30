import React from 'react'
import { UserAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom';
import {jwtDecode} from 'jwt-decode'

const PrivateRoute = ({children}) => {
  const {session,loading} = UserAuth();

  if (loading) return <div>Loading</div>;

  const token = session?.access_token;
  const decodedToken = token ? jwtDecode(token) : null;
  const userRole = decodedToken ? decodedToken.user_role : null;

  return (
    <>
      {userRole === 'admin' ? <>{children}</> : <Navigate to="/"/>}
    </>
  )
}

export default PrivateRoute