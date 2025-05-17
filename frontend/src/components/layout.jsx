// components/Layout.jsx
import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';

export default function Layout() {
  return (
    <nav className="min-h-screen flex flex-col relative">
      {/* Page content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Transparent footer fixed to bottom, behind sidebar if needed */}
      <footer className="fixed bottom-0 left-0 w-full z-10 bg-transparent">
        <nav
          className="text-center py-3 text-sm "
          aria-label="Footer Navigation"
        >
          <ul className="flex justify-center gap-6 text-inherit">
            <li>
              <Link to="/privacypolicy" className="hover:underline">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:underline">
                Contact Us
              </Link>
            </li>
          </ul>
        </nav>
      </footer>
    </nav>
  );
}
