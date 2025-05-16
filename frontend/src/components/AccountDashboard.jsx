import React from 'react'
import { useDarkMode } from '../context/DarkModeContext';
import AccountInfoComponent from './AccountInfoComponent';
import ChangePasswordComponent from './ChangePasswordComponent';
import IdentitiesComponent from './IdentitiesComponent';
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react';


const AccountDashboard = () => {

    const { darkMode, toggleDarkMode } = useDarkMode();

  return (
    <main className={`flex flex-col items-center w-full h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
        <Link to="/"
            className="absolute top-6 left-6 group flex items-center space-x-1"
        >
          <ArrowLeft className="w-5 h-5 text-indigo-500 group-hover:text-indigo-600 transition" />
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-sm text-indigo-500">
              Back to Home
          </span>
        </Link>
        <h2 className="text-4xl font-bold text-gray-800 dark:text-white">Account Information</h2>
        <p className="my-4 text-lg text-gray-600 dark:text-gray-300">Here you can view and manage your account details.</p>
        <AccountInfoComponent />
        <ChangePasswordComponent />
        <IdentitiesComponent />
    </main>
  )
}

export default AccountDashboard