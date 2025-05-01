import React from 'react';
import { Link } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import FileManager from './FileManager';
import { useDarkMode } from '../context/DarkModeContext';
import { ArrowLeft } from 'lucide-react';

const Dashboard = () => {
  const { session, signOut } = UserAuth();
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();

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
    <div className={`min-h-screen p-8 transition-colors duration-300 ${
      darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'
    }`}>
      <div className="max-w-6xl mx-auto">

        <Link
          to="/"
          className="absolute top-6 left-6 group flex items-center space-x-1"
        >
          <ArrowLeft className="w-5 h-5 text-indigo-500 group-hover:text-indigo-600 transition" />
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-sm text-indigo-500">
            Back to Home
          </span>
        </Link>

        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-extrabold mb-1">
              Admin Dashboard
            </h1>
            <p className={`text-lg ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
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
        <div className={`rounded-2xl shadow-md p-8 transition-all border ${
          darkMode
            ? 'bg-gray-800 border-gray-700 hover:border-indigo-500'
            : 'bg-white border-gray-200 hover:border-indigo-400'
        }`}>
          <h2 className="text-2xl font-bold mb-6">
            Manage Files
          </h2>
          <FileManager />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
