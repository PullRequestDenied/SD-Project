import React, { useRef, useState } from 'react';
import { useDarkMode } from '../context/DarkModeContext';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const AdminApplication = () => {
  const form = useRef();
  const { darkMode } = useDarkMode();
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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

    setLoading(true);
    const formData = new FormData(form.current);
    const user = await supabase.auth.getUser(); 
    const user_id = user.data?.user?.id;

    const { error } = await supabase.from('applications').insert([
      {
        user_id,
        user_name: formData.get('user_name'),
        motivation: formData.get('motivation'),
      },
    ]);

    if (error) {
      console.error('Error submitting application:', error.message);
    } else {
      setSuccess(true);
      form.current.reset();
    }

    setLoading(false);
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

          {success && (
            <p className="text-green-500 text-sm text-center mt-4">
              Application submitted successfully!
            </p>
          )}
        </form>
      </section>
    </main>
  );
};

export default AdminApplication;
