import React from 'react'
import { UserAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import FileManager from './FileManager';

const Dashboard = () => {
  const {session, signOut} = UserAuth();
  const navigate = useNavigate();

  const handleSignOut = async (e) => {
    e.preventDefault();
    try{
      await signOut();
      navigate('/signin');
    }catch(err){
      console.error("Error signing out:", err.message);
    } 
  }

  return (
    <div>
      <div>
        Dashboard
        <h2 className='text-3xl font-bold underline'> welcome {session?.user?.user_metadata?.display_name}</h2>
        <p onClick={handleSignOut} className='hover:cursor-pointer border inline-block px-4 py-3 mt-4'>sign out</p>
      </div>
    <div>
      <h2 className='text-3xl font-bold underline'>Upload Test</h2>
      <h1>Admin Dashboard</h1>
        {/* <Link to="/upload-test">Test File Upload</Link>
        <CreateFolder></CreateFolder> */}
        <FileManager></FileManager>
    </div>
    </div>
    
  )
}

export default Dashboard