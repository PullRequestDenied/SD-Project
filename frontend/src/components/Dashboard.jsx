import React from 'react';
import { UserAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import FileManager from './FileManager';

const Dashboard = () => {
  const { session, signOut } = UserAuth();
  const navigate = useNavigate();

  const handleSignOut = async (e) => {
    e.preventDefault();
    try {
      await signOut();
      navigate('/signin');
    } catch (err) {
      console.error('Error signing out:', err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-800 dark:text-white">Admin Dashboard</h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
              Welcome, <span className="font-semibold">{session?.user?.user_metadata?.display_name || 'Admin'}</span> 👋
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg transition duration-200"
          >
            Sign Out
          </button>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-700 dark:text-gray-200">Manage Files</h2>
          <FileManager />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
