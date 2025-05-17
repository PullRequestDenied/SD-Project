import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { UserAuth } from '../context/AuthContext';
import FileManager from './FileManager';
import AdminManager from './AdminManager';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faToolbox,faFolderTree,faHouse,faUserPen,faUserPlus,faArrowRightToBracket, faArrowRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { session, signOut } = UserAuth();
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
    <main className="flex min-h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <aside
        className={`fixed z-10 flex flex-col justify-between h-full px-4 py-6 shadow-md transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-64' : 'w-24'} bg-gray-800`}
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
      >
        {/* Top Navigation */}
        <nav>
          {/* Toggle Sidebar */}
          {/* <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white mb-6"
            aria-label="Toggle sidebar"
          >
            <Menu className="text-white" />
          </button> */}

          {/* Logo / Title */}
          <header
            className={`text-sm font-semibold tracking-wide uppercase leading-5 mb-8 ${
              !sidebarOpen ? 'text-center text-xs' : ''
            }`}
          >
            {sidebarOpen ? 'Constitutional\nArchive' : 'CA'}
          </header>

          
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => setActivePage('fileManager')}
                className="w-full flex items-center justify-center p-2 rounded-md hover:bg-gray-600 transition"
              >
                <span className="text-lg"><FontAwesomeIcon icon={faFolderTree} /></span>
                {sidebarOpen && (
                  <span className={`ml-3 text-sm font-medium ${activePage === 'fileManager' ? 'text-blue-400' : ''}`}>
                    File Manager
                  </span>
                )}
              </button>
            </li>
            <li>
              <button
                onClick={() => setActivePage('adminManager')}
                className="w-full flex items-center justify-center p-2 rounded-md hover:bg-gray-600 transition"
              >
                <span className="text-lg"><FontAwesomeIcon icon={faToolbox} /></span>
                {sidebarOpen && (
                  <span className={`ml-3 text-sm font-medium ${activePage === 'adminManager' ? 'text-blue-400' : ''}`}>
                    Admin Manager
                  </span>
                )}
              </button>
            </li>
          </ul>
        </nav>

        {/* Footer Buttons */}
        <footer className="space-y-2">
        <Link to="/" className="w-full block">
          <button 
          className="w-full text-sm  hover:!border-cyan-600 py-2 rounded-md transition text-white dark:text-white">{sidebarOpen ? 'Home'  : <FontAwesomeIcon icon={faHouse} />}
          </button>
        </Link>

          <button
            onClick={handleSignOut}
            className="w-full text-sm py-2 rounded-md transition hover:bg-red-600">{sidebarOpen ? 'Sign Out' : <FontAwesomeIcon icon={faArrowRightFromBracket} />}
          </button>

        </footer>
      </aside>

      {/* Main Content */}
      <section
        className={`flex-1 p-6 transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-24'
        }`}
      >
        <h2 className="text-3xl font-bold mb-6">
          Welcome, {session?.user?.user_metadata?.display_name}
        </h2>
        {activePage === 'fileManager' ? <FileManager /> : <AdminManager />}
      </section>
    </main>
  );
};

export default Dashboard;
