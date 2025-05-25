import React, { useState } from "react";
import { UserAuth } from "../context/AuthContext";
import { useDarkMode } from "../context/DarkModeContext";
import { useNavigate } from "react-router-dom";

const ResetPassword = () => {
  const { changePassword } = UserAuth();
  const { darkMode } = useDarkMode();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const result = await changePassword(password);
      if (result.success) {
        navigate("/Signin");
      } else {
        setError(result.error.message);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className={`flex items-center justify-center h-screen transition-colors duration-300 ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
      <section
        className={`relative z-10 w-full max-w-md px-6 py-12 shadow-lg rounded-2xl transition-all duration-300 ease-in-out border border-transparent hover:border-indigo-400 ${
          darkMode
            ? "bg-gray-800 border-gray-700 hover:border-indigo-500"
            : "bg-white border-gray-200 hover:border-indigo-400"
        }`}
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Reset Password</h2>

        {error && (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
        )}

        <form onSubmit={handleResetPassword} className="space-y-4">
          <input
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full p-3 rounded-md focus:outline-none focus:ring-2 transition ${
              darkMode
                ? "bg-gray-700 text-white placeholder-gray-400 focus:ring-indigo-500"
                : "bg-gray-100 text-black placeholder-gray-500 focus:ring-indigo-400"
            }`}
            type="password"
            placeholder="Password"
            required
          />

          <input
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`w-full p-3 rounded-md focus:outline-none focus:ring-2 transition ${
              darkMode
                ? "bg-gray-700 text-white placeholder-gray-400 focus:ring-indigo-500"
                : "bg-gray-100 text-black placeholder-gray-500 focus:ring-indigo-400"
            }`}
            type="password"
            placeholder="Confirm Password"
            required
          />

          <button
            className={`w-full py-3 rounded-md text-sm font-medium transition ${
              darkMode
                ? " hover:!border-cyan-600 text-white"
                : " hover:!bg-sky-700 text-white"
            }`}
            type="submit"
            disabled={loading}
          >
            {loading ? "Changing..." : "Change Password"}
          </button>
        </form>
      </section>
    </main>
  );
};

export default ResetPassword;
