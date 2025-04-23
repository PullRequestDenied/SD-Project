import React, { useState } from 'react';
import { UserAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Upload, FolderPlus, FolderTree, Activity, Settings } from 'lucide-react';
import { useDarkMode } from '../context/DarkModeContext';
import Particles from '../assets/Particals';


const Dashboard = () => {
  const { session, signOut } = UserAuth();
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSignOut = async (e) => {
    e.preventDefault();
    try {
      await signOut();
      navigate('/signin');
    } catch (err) {
      console.error("Error signing out:", err.message);
    }
  };

  return (
    <main className={`flex h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      {/* Background Particles */}
      <section className="absolute inset-0 z-0">
        <Particles
          particleColors={['#ffffff', '#000000']}
          particleCount={750}
          particleSpread={12}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover={false}
          alphaParticles={false}
          disableRotation={false}
        />
      </section>

      {/* Sidebar - Matches Landing Page */}
      <aside
        className={`fixed z-10 transition-all duration-300 ease-in-out flex flex-col justify-between h-full px-4 py-6 shadow-md ${
          sidebarOpen ? 'w-64' : 'w-28'
        } ${darkMode ? 'bg-gray-800' : 'bg-white border-r border-gray-200'}`}
      >
        <nav>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-inherit mb-6"
            aria-label="Toggle sidebar"
          >
            <Menu className={`${darkMode ? 'text-white' : 'text-gray-900'}`} />
          </button>

          <header
            className={`text-sm font-semibold tracking-wide uppercase whitespace-pre-line leading-5 mb-8 ${!sidebarOpen ? 'text-center text-xs' : ''}`}
          >
            {sidebarOpen ? 'Constitutional\nArchive' : 'CA'}
          </header>

          <ul className="space-y-2">
            <li>
              <a href="#" className="flex items-center justify-center p-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-700">
                <span className="text-lg">🏛</span>
                {sidebarOpen && <span className={`ml-3 text-sm font-medium ${darkMode ? 'text-white' : 'text-black'}`}>Dashboard</span>}
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center justify-center p-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-700">
                <Upload className="w-5 h-5" />
                {sidebarOpen && <span className={`ml-3 text-sm font-medium ${darkMode ? 'text-white' : 'text-black'}`}>Upload</span>}
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center justify-center p-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-700">
                <FolderTree className="w-5 h-5" />
                {sidebarOpen && <span className={`ml-3 text-sm font-medium ${darkMode ? 'text-white' : 'text-black'}`}>Directories</span>}
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center justify-center p-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-700">
                <Activity className="w-5 h-5" />
                {sidebarOpen && <span className={`ml-3 text-sm font-medium ${darkMode ? 'text-white' : 'text-black'}`}>Activity</span>}
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center justify-center p-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-700">
                <Settings className="w-5 h-5" />
                {sidebarOpen && <span className={`ml-3 text-sm font-medium ${darkMode ? 'text-white' : 'text-black'}`}>Settings</span>}
              </a>
            </li>
          </ul>
        </nav>

        <footer className="space-y-2">
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center justify-center text-sm py-2 rounded-md transition text-white dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700"
          >
            {sidebarOpen ? (
              <>
                <span className="mr-2">🚪</span>
                Sign Out
              </>
            ) : (
              '🚪'
            )}
          </button>
        </footer>
      </aside>

      {/* Main Content Area */}
      <section className={`relative z-10 flex-1 p-8 ml-${sidebarOpen ? '64' : '28'} transition-all duration-300 mt-12`}>
  {/* Add mt-12 to push content down below the button */}
  <header className="flex justify-between items-center mb-8">
    <h3 className="text-2xl font-bold">
      Welcome back, {session?.user?.user_metadata?.display_name || 'Admin'}
    </h3>
  </header>

        {/* Admin Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Upload Card */}
          <div className={`p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center mb-4">
              <Upload className="w-6 h-6 mr-2" />
              <h2 className="text-xl font-semibold">Upload Documents</h2>
            </div>
            <div className={`border-2 border-dashed rounded-lg p-6 text-center mb-4 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
              <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Drag and drop files here or</p>
              <button className={`px-4 py-2 rounded-md ${darkMode ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-500 hover:bg-blue-400'} text-white transition`}>
                Browse Files
              </button>
            </div>
            <div className="mb-4">
              <label className={`block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Metadata</label>
              <textarea
                className={`w-full p-3 rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                rows="3"
                placeholder="Document title, author, date, keywords..."
              ></textarea>
            </div>
            <button className={`w-full py-2 rounded-md ${darkMode ? 'bg-green-600 hover:bg-green-500' : 'bg-green-500 hover:bg-green-400'} text-white transition`}>
              Upload Document
            </button>
          </div>

          {/* Directory Management */}
          <div className={`p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center mb-4">
              <FolderTree className="w-6 h-6 mr-2" />
              <h2 className="text-xl font-semibold">Directory Structure</h2>
            </div>
            <div className={`border rounded-lg p-4 h-64 overflow-y-auto mb-4 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
              <ul className={`space-y-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                <li className="font-medium">Constitution Archive</li>
                <ul className="ml-4 space-y-1">
                  <li>National Documents</li>
                  <ul className="ml-4 space-y-1">
                    <li>Amendments</li>
                    <li>Historical Versions</li>
                  </ul>
                  <li>State Documents</li>
                  <li>Multimedia</li>
                </ul>
              </ul>
            </div>
            <div className="flex space-x-2">
              <button className={`flex-1 py-2 rounded-md ${darkMode ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-500 hover:bg-blue-400'} text-white transition flex items-center justify-center`}>
                <FolderPlus className="w-4 h-4 mr-2" />
                New Folder
              </button>
              <button className={`flex-1 py-2 rounded-md ${darkMode ? 'bg-purple-600 hover:bg-purple-500' : 'bg-purple-500 hover:bg-purple-400'} text-white transition`}>
                Reorganize
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className={`p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center mb-4">
              <Activity className="w-6 h-6 mr-2" />
              <h2 className="text-xl font-semibold">Recent Activity</h2>
            </div>
            <div className="space-y-4">
              <div className={`pb-2 ${darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}`}>
                <p className={darkMode ? 'text-gray-200' : 'text-gray-700'}>Uploaded "2023 Amendment.pdf"</p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>2 hours ago</p>
              </div>
              <div className={`pb-2 ${darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}`}>
                <p className={darkMode ? 'text-gray-200' : 'text-gray-700'}>Created folder "State Documents"</p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Yesterday</p>
              </div>
              <div className={`pb-2 ${darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}`}>
                <p className={darkMode ? 'text-gray-200' : 'text-gray-700'}>Updated metadata for "Original Constitution"</p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>3 days ago</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Preview Section */}
        <div className={`p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className="text-xl font-semibold mb-4">Search Interface Preview</h2>
          <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Test how documents will appear in the public search</p>
          
          <div className={`flex items-center rounded-full overflow-hidden px-4 py-2 shadow-lg transition-colors mb-6 ${
            darkMode ? 'bg-gray-700' : 'bg-white border border-gray-300'
          }`}>
            <input
              type="text"
              placeholder="Search constitutional documents..."
              className="flex-grow bg-transparent px-2 py-1 focus:outline-none placeholder-gray-400 text-inherit"
            />
            <button className="text-blue-500">
              <Search className="w-5 h-5" />
            </button>
          </div>

          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <h3 className="font-medium mb-2">Sample Search Result</h3>
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>This preview shows how documents would appear to public users. Admin can test search functionality before publishing.</p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Dashboard;