import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useDarkMode } from '../context/DarkModeContext';

const PrivacyPolicy = () => {
  const { darkMode, toggleDarkMode } = useDarkMode();

  return (
    <main
      className={`flex items-center justify-center min-h-screen transition-colors duration-300 ${
        darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'
      }`}
    >
      {/* Back Button */}
      <Link
        to="/"
        className="absolute top-6 left-6 group flex items-center space-x-1"
      >
        <ArrowLeft className="w-5 h-5 text-indigo-500 group-hover:text-indigo-600 transition" />
        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-sm text-indigo-500">
          Back to Home
        </span>
      </Link>

      {/* Privacy Policy Card */}
      <section
        className={`relative z-10 w-full max-w-3xl px-6 py-10 shadow-lg rounded-2xl transition-all duration-300 ease-in-out border overflow-y-auto max-h-[85vh] ${
          darkMode
            ? 'bg-gray-800 border-gray-700 hover:border-indigo-500'
            : 'bg-white border-gray-200 hover:border-indigo-400'
        }`}
      >
        <h1 className="text-3xl font-bold mb-6 text-center">Privacy Policy</h1>

        <article className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-2">1. Information We Collect</h2>
            <p>
              We collect and store data necessary for user authentication, system operation, and performance monitoring. This includes:
            </p>
            <ul className="list-disc ml-6">
              <li>Admin user credentials and authentication metadata</li>
              <li>Uploaded files and associated metadata</li>
              <li>Anonymous query logs and usage analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">2. Use of Information</h2>
            <p>Collected data is used to:</p>
            <ul className="list-disc ml-6">
              <li>Authenticate and authorize admin users</li>
              <li>Store, manage, and retrieve archival content</li>
              <li>Optimize search results and improve system usability</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">3. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc ml-6">
              <li><strong>Microsoft Azure</strong>: Cloud hosting and infrastructure.</li>
              <li><strong>GitHub</strong>: Code management and CI/CD.</li>
              <li><strong>Supabase Authentication</strong>: Secure user identity management.</li>
              <li><strong>Supabase</strong>: Database and file storage.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">4. Data Sharing</h2>
            <p>
              We do not sell, rent, or trade user data. Access is limited to administrators and essential service providers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">5. Data Security</h2>
            <p>
              Data is protected using encryption, secure authentication, and industry best practices.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">6. Cookies</h2>
            <p>
              We use session cookies for login persistence and navigation improvement, not for tracking or ads.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">7. Your Rights</h2>
            <p>
              You can request access to, correction of, or deletion of your data by contacting the admin.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">8. Changes to this Policy</h2>
            <p>
              We may update this policy. Changes will be reflected on this page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-2">9. Contact</h2>
            <p>
              For privacy inquiries, reach out to us at{' '}
              <a
                href="mailto:constitutionalarchive@gmail.com"
                className="underline text-blue-500 hover:text-blue-400"
              >
                constitutionalarchive@gmail.com
              </a>.
            </p>
          </section>
        </article>
      </section>
    </main>
  );
};

export default PrivacyPolicy;
