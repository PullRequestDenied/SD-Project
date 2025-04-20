import { useState, useEffect } from 'react';
import { Menu, Moon, Sun, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import BlurText from '../assets/BlurText';
import ShinyText from '../assets/ShinyText';
import Particles from '../assets/Particals';
import { useDarkMode } from '../context/DarkModeContext';



export default function LandingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { darkMode, toggleDarkMode } = useDarkMode();
  console.log('LandingPage darkMode:', darkMode);
  useEffect(() => {
    console.log("LANDING PAGE sees darkMode:", darkMode);
  }, [darkMode]);

  return (

    
    <main className={`flex h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      {/* <section className="absolute inset-0 z-0">
        <Aurora
          colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
          // colorStops={["#00D8FF", "#7CFF67", "#00D8FF"]}
          blend={0.5}
          amplitude={1.0}
          speed={0.5}
        />
      </section> */}


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

      
      
      {/* Sidebar */}
      <aside
        className={`fixed z-10 transition-all duration-300 ease-in-out flex flex-col justify-between h-full px-4 py-6 shadow-md ${
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
              <a href="#" className="flex items-center justify-center p-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">
              <span className="text-lg">🏛</span>
                {sidebarOpen ? <span className={`ml-3 text-sm font-medium ${darkMode ? 'text-white' : 'text-black'}`}>Home</span> : null}
              </a>
            </li>
            <li>
            <a href="#" className="flex items-center justify-center p-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">
                <span>{'📚'}</span>
                {sidebarOpen ? <span className={`ml-3 text-sm font-medium ${darkMode ? 'text-white' : 'text-black'}`}>Library</span> : null}
              </a>
            </li>
          </ul>
        </nav>

        <footer className="space-y-2">


          <Link to="/signup" className="w-full block">
          <button className="w-full text-sm  hover:!border-cyan-600  py-2 rounded-md transition text-white dark:text-white">
            {sidebarOpen ? 'Sign Up' : '✍️'}
          </button>
          </Link>

          <Link to="/signin" className="w-full block">
          <button className="w-full text-sm  hover:!border-cyan-600 py-2 rounded-md transition text-white dark:text-white">
            {sidebarOpen ? 'Log in' : '🔑'}
          </button>
          </Link>
          <Link to="/privacypolicy" className="w-full block">
          {sidebarOpen && (
          <button className="w-full text-sm py-2 rounded-md transition text-white dark:text-white">
            Privacy policy
          </button>
        )}
        </Link>

        <Link to="/contact" className="w-full block">
        {sidebarOpen && (
          <button className="w-full text-sm  py-2 rounded-md transition text-white dark:text-white">
            Contact us
          </button>
          
        )}
        </Link>

          {/* Theme Toggle Button */}
          <button 
          onClick={toggleDarkMode}  
            className="w-full flex items-center justify-center text-sm hover:border-pink-500 dark:hover:border-indigo-500 py-2 rounded-md transition text-white dark:text-white "
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

        </footer>
      </aside>

      {/* Main content */}
      <section className="relative z-10 flex flex-1 items-center justify-center p-4 ml-64">
        <article className="w-full max-w-xl text-center">
        <BlurText
          text="What would you like to explore?"
          delay={70}
          animateBy="words"
          direction="top"
          // onAnimationComplete={handleAnimationComplete}
          className="text-4xl mb-8"
        />

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
            <button>
              <ShinyText text="search!" disabled={false} speed={2} className='custom-class' /> 
            </button>

          </form>
        </article>
      </section>
    </main>
  );
}
