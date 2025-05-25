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
    <main className={`flex flex-col items-center w-full min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
        <Link to="/"
            className="absolute top-6 left-6 group flex items-center space-x-1"
        >
          <ArrowLeft className="w-5 h-5 text-indigo-500 group-hover:text-indigo-600 transition" />
          <p className="opacity-0 group-hover:opacity-100 transition-opacity text-sm text-indigo-500">
              Back to Home
          </p>
        </Link>


        <header className="text-center mb-15 mt-15">
        <h2 className="text-4xl font-bold">Account Information</h2>
        <p className={`mt-2 text-lg `}>
          Here you can view and manage your account details.
        </p>
      </header>

      <section className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6 items-start mb-10 ">

        <section className="pt-2">
          <AccountInfoComponent />
        </section>

        <section className="pt-2">
          <ChangePasswordComponent />
        </section>

      </section>

      <section className="w-full max-w-5xl">
        <IdentitiesComponent />
      </section>

    </main>
  );
};

export default AccountDashboard;
