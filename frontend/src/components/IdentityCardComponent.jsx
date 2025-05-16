import React from 'react'
import { useDarkMode } from '../context/DarkModeContext';

const IdentityCardComponent = ({identity}) => {
    const { darkMode } = useDarkMode();

  return (
    <section className={`flex flex-col w-full px-6 py-3 rounded-md transition-all duration-300 ease-in-out border border-transparent hover:border-indigo-400 ${
                  darkMode
                  ? 'bg-gray-700 border-gray-700 '
                  : 'bg-white border-gray-200 '
                }`}>
        <p>{identity?.provider}</p>

    </section>
  )
}

export default IdentityCardComponent