import React, { useState, useEffect } from 'react';
import { useDarkMode } from '../context/DarkModeContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleXmark, faCircleCheck} from '@fortawesome/free-solid-svg-icons'

export default function AdminUserCard({ name, email, isAdmin, onToggle, onReject, motivation }) {
  const { darkMode } = useDarkMode();
  const [showMotivation, setShowMotivation] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showMotivation) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [showMotivation]);

  return (
    <article
      className={`border rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
      }`}
    >
      <header className="mb-3">
        <h2 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{name}</h2>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{email}</p>
        {isAdmin && (
          <span className="inline-block mt-1 text-xs font-medium text-green-600 bg-green-200 px-2 py-0.5 rounded">
            Admin
          </span>
        )}
      </header>

      <footer className="flex gap-2 flex-wrap justify-end">
        <button id='toggleBtn'
          title= {isAdmin ? 'Remove' : 'Accept'}
          onClick={onToggle}
          className={`text-sm px-4 py-2 rounded-md font-medium transition duration-150 ${
            isAdmin
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isAdmin ? (<FontAwesomeIcon icon={faCircleXmark} />) : (<FontAwesomeIcon icon={faCircleCheck} />)}
        </button>
        {!isAdmin && onReject && (
          <>
            <button id='rejectBtn'
              title='Reject'
              onClick={onReject}
              className="text-sm px-4 py-2 rounded-md bg-yellow-600 hover:bg-yellow-700 text-white font-medium transition duration-150"
            >
              <FontAwesomeIcon icon={faCircleXmark} />
            </button>
            <button
              onClick={() => setShowMotivation(true)}
              className="text-sm px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition duration-150"
            >
              View Motivation
            </button>
          </>
        )}
      </footer>

      {/* Motivation Modal */}
      {showMotivation && (
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="motivation-heading"
          className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black/10"
        >
          <div
            className={`w-full max-w-2xl p-8 rounded-2xl shadow-2xl ${
              darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
            }`}
          >
            <h3 id="motivation-heading" className="text-2xl font-semibold mb-6">
              Motivation
            </h3>
            <p className="text-lg md:text-xl whitespace-pre-wrap leading-relaxed">
              {motivation || 'No motivation provided.'}
            </p>
            <div className="mt-6 text-right">
              <button
                onClick={() => setShowMotivation(false)}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-base rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
