import React, { useRef, useState, useEffect } from 'react';
import { useDarkMode } from '../context/DarkModeContext';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext';


const AdminApplication = () => {
  const form = useRef();
  const { darkMode } = useDarkMode();
 
 const { session } = UserAuth();
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [status, setStatus] = useState('');
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState('');

  const hostUrl = 'http://localhost:5000/api/admin';

  // ✅ Extracted status check into a function
  const checkApplication = async (token) => {
    const response = await fetch(`${hostUrl}/application`, {
      method: 'GET',
      headers: {
        'Authorization': `${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.alreadyApplied) {
      setAlreadyApplied(true);
      const accepted = data.is_accepted;
      const denied = data.is_denied;

      if (accepted) setStatus('accepted');
      else if (denied) setStatus('denied');
      else setStatus('pending');
    } else {
      setAlreadyApplied(false);
      setStatus('');
    }
  };

  useEffect(() => {
    const fetchSessionAndCheck = async () => {
      setToken(session?.access_token);
      setUserId(session?.user?.id);
      if (token) await checkApplication(token);
    };

    fetchSessionAndCheck();
  }, [token]);

  const validate = () => {
    const formData = new FormData(form.current);
    const name = formData.get('user_name')?.trim();
    const motivation = formData.get('motivation')?.trim();

    const newErrors = {};
    if (!name) newErrors.user_name = 'Name is required';
    if (!motivation) newErrors.message = 'Motivation is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (!userId) return;

    setLoading(true);

    const formData = new FormData(form.current);
    const name = formData.get('user_name');
    const motivation = formData.get('motivation');

    try{
      const response = await fetch(`${hostUrl}/submit-application`, {
        method: 'POST',
        headers: {
          'Authorization': `${token}`, // or just token if your backend expects it that way
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: userId,
          user_name: name,
          motivation: motivation,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error submitting application:', errorData.error);
      } else {
        form.current.reset();
        await checkApplication(token); // Recheck application after submission
      }
  } catch (error) {
    console.error('Error submitting application:', error.message);
  }

  setLoading(false);
  };

  const renderStatusMessage = () => {
    if (!alreadyApplied) return null;

    switch (status) {
      case 'accepted':
        return <p className="text-green-500 text-sm text-center mt-4">✅ Your application has been accepted.</p>;
      case 'denied':
        return <p className="text-red-500 text-sm text-center mt-4">❌ Your application was denied. You cannot apply again.</p>;
      case 'pending':
        return <p className="text-yellow-400 text-sm text-center mt-4">⏳ Your application is under review.</p>;
      default:
        return <p className="text-gray-400 text-sm text-center mt-4">ℹ️ Application found.</p>;
    }
  };

  return (
    <main
      className={`flex items-center justify-center min-h-screen transition-colors duration-300 ${
        darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'
      }`}
    >
      <Link to="/" className="absolute top-6 left-6 group flex items-center space-x-1">
        <ArrowLeft className="w-5 h-5 text-indigo-500 group-hover:text-indigo-600 transition" />
        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-sm text-indigo-500">
          Back to Home
        </span>
      </Link>

      <section
        className={`relative z-10 w-full max-w-md px-6 py-12 shadow-lg rounded-2xl transition-all duration-300 ease-in-out border ${
          darkMode
            ? 'bg-gray-800 border-gray-700 hover:border-indigo-500'
            : 'bg-white border-gray-200 hover:border-indigo-400'
        }`}
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Admin Application</h2>

        {alreadyApplied ? (
          renderStatusMessage()
        ) : (
          <form ref={form} onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <input
                type="text"
                name="user_name"
                placeholder="Your Name"
                className={`w-full p-3 rounded-md focus:outline-none focus:ring-2 transition ${
                  darkMode
                    ? 'bg-gray-700 text-white placeholder-gray-400 focus:ring-indigo-500'
                    : 'bg-gray-100 text-black placeholder-gray-500 focus:ring-indigo-400'
                }`}
              />
              {errors.user_name && <p className="text-sm text-red-500 mt-1">{errors.user_name}</p>}
            </div>

            <div>
              <textarea
                name="motivation"
                placeholder="Give a short motivation on why you want to become an admin"
                rows="4"
                className={`w-full p-3 rounded-md focus:outline-none focus:ring-2 transition resize-none ${
                  darkMode
                    ? 'bg-gray-700 text-white placeholder-gray-400 focus:ring-indigo-500'
                    : 'bg-gray-100 text-black placeholder-gray-500 focus:ring-indigo-400'
                }`}
              ></textarea>
              {errors.message && <p className="text-sm text-red-500 mt-1">{errors.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-md text-sm font-medium transition ${
                darkMode
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-indigo-500 hover:bg-indigo-600 text-white'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
};

export default AdminApplication;
