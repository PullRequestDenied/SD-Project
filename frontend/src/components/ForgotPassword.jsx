import React, {useState} from 'react'
import { Link } from 'react-router-dom'
import { UserAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useDarkMode } from '../context/DarkModeContext'
import { ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {

    const {requestReset} = UserAuth();
    const { darkMode } = useDarkMode();
    const [loading, setLoading] = useState("");
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [sentResetLink, setSentResetLink] = useState(false);
    

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await requestReset(email);
            if (result.success) {
                setSentResetLink(true);
            } else {
                setError(result.error.message);
            }
        } catch (error) {
            setError(error);
        }finally {
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
            <h2 className="text-2xl font-bold mb-6 text-center">Reset Password</h2>

            {!sentResetLink && error && (
              <p className="text-red-500 text-sm text-center mb-4">{error}</p>
            )}

            {sentResetLink && (
              <p className="text-m text-center mb-4">Password reset link sent your email</p>
            )}
    
            <form onSubmit={handleResetPassword} className="space-y-4">
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
              
              <button
                className={`w-full py-3 rounded-md text-sm font-medium transition ${
                  darkMode
                    ? ' hover:!border-cyan-600 text-white'
                    : ' hover:!bg-sky-700 text-white'
                }`}
                type="submit"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
        </section>
    </main>
  )
}

export default ForgotPassword