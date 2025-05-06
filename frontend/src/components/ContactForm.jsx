import React, { useRef, useState } from 'react';
import emailjs from '@emailjs/browser';
import { useDarkMode } from '../context/DarkModeContext';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom'

const ContactForm = () => {
  const form = useRef();
  const { darkMode } = useDarkMode();

  const [errors, setErrors] = useState({});
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const validate = () => {
    const formData = new FormData(form.current);
    const name = formData.get('user_name')?.trim();
    const email = formData.get('user_email')?.trim();
    const message = formData.get('message')?.trim();

    const newErrors = {};
    if (!name) newErrors.user_name = 'Name is required';
    if (!email) newErrors.user_email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.user_email = 'Email is invalid';
    if (!message) newErrors.message = 'Message is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendEmail = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSending(true);
    setIsSent(false);

    emailjs
      .sendForm(
        'service_cons1',
        'template_jbgkjea',
        form.current,
        'bu3Puo5ZtVcfpuHZO'
      )
      .then(() => {
        setIsSent(true);
        form.current.reset();
        setErrors({});
      })
      .catch((error) => {
        alert('Failed to send message. ' + error.text);
      })
      .finally(() => {
        setIsSending(false);
      });
  };

  return (
    <main
      className={`flex items-center justify-center min-h-screen transition-colors duration-300 ${
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
        <h2 className="text-2xl font-bold mb-6 text-center">Contact Us</h2>

        <form ref={form} onSubmit={sendEmail} noValidate className="space-y-4">
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
            {errors.user_name && (
              <p className="text-sm text-red-500 mt-1">{errors.user_name}</p>
            )}
          </div>

          <div>
            <input
              type="email"
              name="user_email"
              placeholder="Your Email"
              className={`w-full p-3 rounded-md focus:outline-none focus:ring-2 transition ${
                darkMode
                  ? 'bg-gray-700 text-white placeholder-gray-400 focus:ring-indigo-500'
                  : 'bg-gray-100 text-black placeholder-gray-500 focus:ring-indigo-400'
              }`}
            />
            {errors.user_email && (
              <p className="text-sm text-red-500 mt-1">{errors.user_email}</p>
            )}
          </div>

          <div>
            <textarea
              name="message"
              placeholder="Your Message"
              rows="4"
              className={`w-full p-3 rounded-md focus:outline-none focus:ring-2 transition resize-none ${
                darkMode
                  ? 'bg-gray-700 text-white placeholder-gray-400 focus:ring-indigo-500'
                  : 'bg-gray-100 text-black placeholder-gray-500 focus:ring-indigo-400'
              }`}
            ></textarea>
            {errors.message && (
              <p className="text-sm text-red-500 mt-1">{errors.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSending || isSent}
            className={`w-full py-3 rounded-md text-sm font-medium transition ${
              darkMode
                ? 'hover:!border-cyan-600 text-white'
                : 'hover:!bg-sky-700 text-white'
            } ${isSending ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSent ? 'Sent!' : isSending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </section>
    </main>
  );
};

export default ContactForm;
