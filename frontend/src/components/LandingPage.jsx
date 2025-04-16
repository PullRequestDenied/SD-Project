import { useState } from 'react';
import { Menu, Moon, Sun, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  return (
    <main className={`flex h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      {/* Sidebar */}
      <aside
        className={`transition-all duration-300 ease-in-out flex flex-col justify-between px-4 py-6 shadow-md ${
          sidebarOpen ? 'w-64' : 'w-28'
        } ${darkMode ? 'bg-gray-800' : 'bg-white border-r border-gray-200'}`}
      >
        <nav>
          {/* Collapse Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-inherit mb-6"
            aria-label="Toggle sidebar"
          >
             <Menu className={`${darkMode ? 'text-white' : 'text-white'}`} />
          </button>

          {/* Logo / Title */}
          <header
            className={`text-sm font-semibold tracking-wide uppercase whitespace-pre-line leading-5 mb-8 ${!sidebarOpen ? 'text-center text-xs' : ''}`}
          >
            {sidebarOpen ? 'Constitutional\nArchive' : 'CA'}
          </header>

          <ul className="space-y-2">
            <li>
              {/* <a href="#" className="flex flex-col items-center justify-center p-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-700"> */}
              <a href="#" className="flex items-center justify-center p-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-700">
              <span className="text-lg">🏛</span>
                {sidebarOpen ? <span className={`ml-3 text-sm font-medium ${darkMode ? 'text-white' : 'text-black'}`}>Home</span> : null}
              </a>
            </li>
            <li>
            <a href="#" className="flex items-center justify-center p-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-700">
                <span>{'📚'}</span>
                {sidebarOpen ? <span className={`ml-3 text-sm font-medium ${darkMode ? 'text-white' : 'text-black'}`}>Library</span> : null}
              </a>
            </li>
          </ul>
        </nav>

        <footer className="space-y-2">
          {/* Theme Toggle Button */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-full flex items-center justify-center text-sm bg-indigo-400 hover:bg-indigo-500 dark:bg-indigo-300 dark:hover:bg-indigo-400 py-2 rounded-md transition text-white dark:text-white"
          >
            {sidebarOpen ? (
              <>
                {darkMode ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
                {darkMode ? 'Light Mode' : 'Dark Mode'}
              </>
            ) : (
              darkMode ? <Sun /> : <Moon />
            )}
          </button>

          <button className="w-full text-sm bg-emerald-400 hover:bg-emerald-500 dark:bg-emerald-300 dark:hover:bg-emerald-400 py-2 rounded-md transition text-white dark:text-white">
            {sidebarOpen ? 'Sign Up' : '✍️'}
          </button>
          <button className="w-full text-sm bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-300 dark:hover:bg-cyan-400 py-2 rounded-md transition text-white dark:text-white">
            {sidebarOpen ? 'Log in' : '🔑'}
          </button>
        </footer>
      </aside>

      {/* Main content */}
      <section className="flex flex-1 items-center justify-center p-4">
        <article className="w-full max-w-xl text-center">
          <h1 className="text-xl md:text-2xl font-semibold mb-6">
            What would you like to explore?
          </h1>

          <form
            className={`flex items-center rounded-full overflow-hidden px-2 py-1 shadow-lg transition-colors ${
              darkMode ? 'bg-gray-800' : 'bg-white border border-gray-300'
            }`}
          >
            <input
              type="text"
              placeholder="Search constitutional documents..."
              className="flex-grow bg-transparent px-4 py-2 focus:outline-none placeholder-gray-400 text-inherit"
            />
            <button
              type="submit"
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-full text-white transition"
            >
              <Search className="w-4 h-4 mr-1" />
              Search
            </button>
          </form>
        </article>
      </section>
    </main>
  );
}
