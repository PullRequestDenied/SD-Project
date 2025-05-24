import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext';
// import FileManager from './FileManager';
import FileManagerPage from './FileManagerPage';
import AdminManager from './AdminManager';
import { useDarkMode } from '../context/DarkModeContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faToolbox,
  faFolderTree,
  faHouse,
  faArrowRightFromBracket,
} from '@fortawesome/free-solid-svg-icons';

const Dashboard = () => {
  const { session, signOut } = UserAuth();
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState('fileManager');

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/signin');
    } catch (err) {
      console.error('Error signing out:', err.message);
    }
  };

  return (
    <main
      className={`flex min-h-screen transition-colors duration-300 ${
        darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'
      }`}
    >
      {/* Sidebar */}
      <aside
        className={`fixed z-10 flex flex-col justify-between h-full px-4 py-6 shadow-md transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'w-64' : 'w-28'
        } ${darkMode ? 'bg-gray-800' : 'bg-white border-r border-gray-200'}`}
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
      >
        <nav>
          <header
            className={`text-xl font-semibold tracking-wide whitespace-pre-line leading-5 mb-8 ${
              !sidebarOpen ? 'text-center' : ''
            }`}
          >
            {sidebarOpen ? 'Consti-' : 'C'}
            <span className="text-indigo-500">Q</span>
          </header>

          <ul className="space-y-2">
            <li>
              <button
                onClick={() => setActivePage('fileManager')}
                className={`w-full text-sm hover:!border-cyan-600 py-2 rounded-md transition text-white ${
                  activePage === 'fileManager' ? 'text-blue-500 font-semibold' : ''
                }`}
              >
                {sidebarOpen ? 'File Manager' : <FontAwesomeIcon icon={faFolderTree} />}
              </button>
            </li>

            <li>
              <button
                onClick={() => setActivePage('adminManager')}
                className={`w-full text-sm hover:!border-cyan-600 py-2 rounded-md transition text-white ${
                  activePage === 'adminManager' ? 'text-blue-500 font-semibold' : ''
                }`}
              >
                {sidebarOpen ? 'Admin Manager' : <FontAwesomeIcon icon={faToolbox} />}
              </button>
            </li>
          </ul>
        </nav>

        <footer className="space-y-2">
          <Link to="/" className="w-full block">
            <button className="w-full text-sm hover:!border-cyan-600 py-2 rounded-md transition text-white">
              {sidebarOpen ? 'Home' : <FontAwesomeIcon icon={faHouse} />}
            </button>
          </Link>

          <button id='signoutBtn'
            onClick={handleSignOut}
            className="w-full text-sm hover:!border-red-600 py-2 rounded-md transition text-white"
          >
            {sidebarOpen ? 'Sign Out' : <FontAwesomeIcon icon={faArrowRightFromBracket} />}
          </button>
        </footer>
      </aside>

      {/* Main Content */}
      <section
        className={`flex-1 p-6 transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-28'
        }`}
      >
        <h2 className="text-3xl font-bold mb-6">
          Welcome, {session?.user?.user_metadata?.display_name}
        </h2>
        {activePage === 'fileManager' ? <FileManagerPage /> : <AdminManager />}
      </section>
    </main>
  );
};

export default Dashboard;
