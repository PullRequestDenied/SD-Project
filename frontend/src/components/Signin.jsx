import React, {useState} from 'react'
import { Link } from 'react-router-dom'
import { UserAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useDarkMode } from '../context/DarkModeContext'
import { ArrowLeft } from 'lucide-react';



const Signin = () => {
    const [loading, setLoading] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [wrongPassword, setWrongPassword] = useState(0);
    const [resetPassword, setResetPassword] = useState(false);

    const {signInUser, signInWithGithub} = UserAuth();
    const navigate = useNavigate();
    const { darkMode } = useDarkMode();

    const handleSignIn = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await signInUser(email, password);
            if (result.success) {
                navigate('/Dashboard');
            } else {
                setError(result.error.message);
                setWrongPassword(prev => prev + 1);
                if (wrongPassword >= 2) {
                    setError('Too many failed attempts. ');
                    setResetPassword(true);
                }
            }
        } catch (error) {
            setError('An error occurred during sign up. Please try again.');
        }finally {
            setLoading(false);
        }
    }

     const handleGithubSignIn = async () => {
        setLoading(true);
        try {
            const { data, error } = await signInWithGithub();
            if (error) {
                setError('An error occurred during GitHub sign in. Please try again.');
            } else {
                navigate('/Dashboard');
            }
        } catch (error) {
            setError('An error occurred during GitHub sign in. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <main
          className={`flex items-center justify-center h-screen transition-colors duration-300 ${
            darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'
          }`}
        >
        <Link to="/"
            className="absolute top-6 left-6 group flex items-center space-x-1"
        >
        <ArrowLeft className="w-5 h-5 text-indigo-500 group-hover:text-indigo-600 transition" />
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-sm text-indigo-500">
                Back to Home
            </span>
        </Link>

          <section
            className={`relative z-10 w-full max-w-md px-6 py-12 shadow-lg rounded-2xl transition-all duration-300 ease-in-out border border-transparent hover:border-indigo-400 ${
              darkMode
                ? 'bg-gray-800 border-gray-700 hover:border-indigo-500'
                : 'bg-white border-gray-200 hover:border-indigo-400'
            }`}
          >
            <h2 className="text-2xl font-bold mb-6 text-center">Sign In</h2>
    
            {!resetPassword && error && (
              <p className="text-red-500 text-sm text-center mb-4">{error}</p>
            )}

            {resetPassword && (
              <div>
                <p className="text-sm text-center mb-4">
                Forgot your password?
                <Link
                  to="/forgotpassword"
                  className={`underline transition ${
                    darkMode
                      ? 'text-indigo-300 hover:text-indigo-200'
                      : 'text-indigo-600 hover:text-indigo-800'
                  }`}
                >
                  {" Reset Password"}
                </Link>
              </p>
              </div>
            )}
    
            <form onSubmit={handleSignIn} className="space-y-4">
              <input
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full p-3 rounded-md focus:outline-none focus:ring-2 transition ${
                  darkMode
                    ? 'bg-gray-700 text-white placeholder-gray-400 focus:ring-indigo-500'
                    : 'bg-gray-100 text-black placeholder-gray-500 focus:ring-indigo-400'
                }`}
                type="email"
                placeholder="you@example.com"
                required
              />
              <input
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full p-3 rounded-md focus:outline-none focus:ring-2 transition ${
                  darkMode
                    ? 'bg-gray-700 text-white placeholder-gray-400 focus:ring-indigo-500'
                    : 'bg-gray-100 text-black placeholder-gray-500 focus:ring-indigo-400'
                }`}
                type="password"
                placeholder="Password"
                required
              />
              <button
                className={`w-full py-3 rounded-md text-sm font-medium transition ${
                  darkMode
                    ? ' hover:!border-cyan-600 text-white'
                    : ' hover:!bg-sky-700 text-white'
                }`}
                type="submit"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <button className={`w-full mt-3 py-3 rounded-md text-sm font-medium transition ${
                  darkMode
                    ? 'hover:!border-cyan-600 text-white'
                    : 'hover:!bg-sky-700 text-white'
                }`}
                onClick={handleGithubSignIn}>
                  signin with github
            </button>
    
            <p className="mt-6 text-sm text-center">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className={`underline transition ${
                  darkMode
                    ? 'text-indigo-300 hover:text-indigo-200'
                    : 'text-indigo-600 hover:text-indigo-800'
                }`}
              >
                Sign Up
              </Link>
            </p>
          </section>
        </main>
      );
    };
    
    export default Signin;
    