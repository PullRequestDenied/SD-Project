import { useState, useEffect } from 'react';
import { UserAuth } from '../context/AuthContext';
import { Menu, Moon, Sun, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import BlurText from '../assets/BlurText';
import ShinyText from '../assets/ShinyText';
import Particles from '../assets/Particals';
import { useDarkMode } from '../context/DarkModeContext';
import { supabase } from '../supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHouse,faUserPen,faUserPlus,faArrowRightToBracket, faArrowRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import{faBookmark,faPenToSquare,faFolderOpen,faUser} from '@fortawesome/free-regular-svg-icons'





export default function LandingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { darkMode, toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const { session, signOut } = UserAuth();
  const user = session?.user;
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkedAdmin, setCheckedAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // console.log('LandingPage darkMode:', darkMode);
  // useEffect(() => {
  //   console.log("LANDING PAGE sees darkMode:", darkMode);
  // }, [darkMode]);

  const handleSignOut = async (e) => {
    e.preventDefault();
    try {
      await signOut();
      navigate('/signin');
    } catch (err) {
      console.error('Error signing out:', err.message);
    }
  };

  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('user_roles') 
          .select('role')
          .eq('user_id', user.id)
          
          

        if (error) {
          console.error('Error checking admin status:', error.message);
        } else {
          const isUserAdmin = data?.some(roleEntry => roleEntry.role === 'admin');
          setIsAdmin(isUserAdmin);
        }
        setCheckedAdmin(true);
      }
    };

    checkAdmin();
  }, [user]);
  const handleSubmit = (e) => {
  e.preventDefault()
  if (!searchTerm.trim()) return
  navigate(`/search?term=${encodeURIComponent(searchTerm.trim())}`)
}


  return (

    
    <main className={`flex h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>



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
        className={`fixed z-20 transition-all duration-300 ease-in-out flex flex-col justify-between h-full px-4 py-6 shadow-md ${sidebarOpen ? 'w-64' : 'w-28'} ${darkMode ? 'bg-gray-800' : 'bg-white border-r border-gray-200'}`}
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
      >
        <nav>
          {/* Collapse Button
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-inherit mb-6"
            aria-label="Toggle sidebar"
          >
             <Menu className={`${darkMode ? 'text-white' : 'text-white'}`} />
          </button> */}

          {/* Logo / Title */}
          <header
            className={`text-xl font-semibold tracking-wide whitespace-pre-line leading-5 mb-8 ${!sidebarOpen ? 'text-center' : ''}`}
          >
            {sidebarOpen ? 'Consti-' : 'C'}
            <span className="text-indigo-500">Q</span>
          </header>

          <ul className="space-y-2">
           
            <Link to="/" className="w-full block">
                <button
                className="w-full text-sm  hover:!border-cyan-600 py-2 rounded-md transition text-white dark:text-white">{sidebarOpen ? 'Home'  : <FontAwesomeIcon icon={faHouse} />}
                </button>
              </Link>

              {/* <Link to="/" className="w-full block">
                <button 
                className="w-full text-sm hover:!border-cyan-600 py-2 rounded-md transition text-white dark:text-white">{sidebarOpen ? 'Library' : <FontAwesomeIcon icon={faBookmark} />}
                </button>
              </Link> */}

            
          </ul>
        </nav>

        <footer className="space-y-2">
        {user && checkedAdmin && (
          <>
            {isAdmin ? (
              <Link to="/dashboard" className="w-full block">
                <button id='dashboardBtn'
                className="w-full text-sm hover:!border-cyan-600 py-2 rounded-md transition text-white dark:text-white">{sidebarOpen ? 'Dashboard' : <FontAwesomeIcon icon={faFolderOpen} />}
                </button>
              </Link>
            ) : (
              <Link to="/adminapplication" className="w-full block">
                <button id='applicationBtn'
                className="w-full text-sm hover:!border-cyan-600 py-2 rounded-md transition text-white dark:text-white">{sidebarOpen ? 'Apply for Admin' : <FontAwesomeIcon icon={faPenToSquare} />}
                </button>
              </Link>
            )}

            <Link to="/account" className="w-full block">
                <button id='accountbtn'
                className="w-full text-sm hover:!border-cyan-600 py-2 rounded-md transition text-white dark:text-white">{sidebarOpen ? 'Account' : <FontAwesomeIcon icon={faUser} />}
                </button>
              </Link>

            <button id='signoutBtn'
              onClick={handleSignOut}
              className="w-full text-sm hover:!border-red-600 py-2 rounded-md transition text-white dark:text-white">
              {sidebarOpen ? 'Sign Out' : <FontAwesomeIcon icon={faArrowRightFromBracket} />}
            </button>
          </>
        )}

        {!user && (
          <>
            <Link to="/signup" className="w-full block">
              <button id='SignupBtn' className="w-full text-sm hover:!border-cyan-600 py-2 rounded-md transition text-white dark:text-white">
                {sidebarOpen ? 'Sign Up' : <FontAwesomeIcon icon={faUserPlus} />}
              </button>
            </Link>

            <Link to="/signin" className="w-full block">
              <button id='SigninBtn' className="w-full text-sm hover:!border-cyan-600 py-2 rounded-md transition text-white dark:text-white">
                {sidebarOpen ? 'Sign in' : <FontAwesomeIcon icon={faArrowRightToBracket} />}
              </button>
            </Link>
          </>
        )}

        {/* Theme Toggle Button */}
          <button 
            onClick={toggleDarkMode}  
            className="w-full flex items-center justify-center text-sm hover:border-pink-500 dark:hover:border-indigo-500 py-2 rounded-md transition text-white dark:text-white " >
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
      <section
        className={`relative z-10 flex flex-1 items-center justify-center p-4 transition-all duration-300 ${ sidebarOpen ? 'ml-64' : 'ml-28' }`}>
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
            onSubmit={handleSubmit}
            className={`flex items-center rounded-full overflow-hidden px-2 py-1 shadow-lg transition-colors ${
              darkMode ? 'bg-gray-800' : 'bg-white border border-gray-300'
            }`}
          >
            <input
              type="text"
              value={searchTerm}
              placeholder="Search constitutional documents..."
              className="flex-grow bg-transparent px-4 py-2 focus:outline-none placeholder-gray-400 text-inherit"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit">
              <ShinyText text="search!" disabled={false} speed={2} className='custom-class' /> 
            </button>

          </form>
        </article>
      </section>
    </main>
  );
}

