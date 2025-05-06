import React from 'react'
import { useDarkMode } from '../context/DarkModeContext';
import AccountInfoComponent from './AccountInfoComponent';

const AccountDashboard = () => {

    const { darkMode, toggleDarkMode } = useDarkMode();

  return (
    <main className={`flex flex-col items-center w-full h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
        <h2 className="text-4xl font-bold text-gray-800 dark:text-white">Account Information</h2>
        <p className="my-4 text-lg text-gray-600 dark:text-gray-300">Here you can view and manage your account details.</p>
        <AccountInfoComponent />
    </main>
  )
}

export default AccountDashboard