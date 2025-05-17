import React, {useState} from 'react'
import { UserAuth } from '../context/AuthContext'
import { useDarkMode } from '../context/DarkModeContext'

const ChangePasswordComponent = () => {

    const {changePassword} = UserAuth();
    const { darkMode } = useDarkMode();
    const [loading, setLoading] = useState(false);
    //const [oldPassword, setOldPassword] = useState("")
    const [password, setPassword] = useState(""); 
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

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
                setError("");
                setSuccessMessage("Password changed successfully");
                setPassword("");
                setConfirmPassword("");
            } else {
                setSuccessMessage("");
                setError(result.error.message);
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

  return (
    <section className={`flex justify-center transition-colors duration-300 mt-6 mb-6${
        darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'
      }`}>
        <section
            className={`relative z-10 w-xl px-6 py-12 shadow-lg rounded-md transition-all duration-300 ease-in-out border border-transparent hover:border-indigo-400 ${
              darkMode
                ? 'bg-gray-800 border-gray-700 hover:border-indigo-500'
                : 'bg-white border-gray-200 hover:border-indigo-400'
            }`}>
            <h2 className="text-2xl font-bold mb-6 text-center">Change Password</h2>

            {error && (
              <p className="text-red-500 text-sm text-center mb-4">{error}</p>
            )}

            {successMessage && (
              <p className="text-500 text-sm text-center mb-4">{successMessage}</p>
            )}
    
            <form onSubmit={handleResetPassword} className="space-y-4">

              <label htmlFor="newPassword" className='my-2'>New Password</label>
              <input
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full p-3 rounded-md focus:outline-none focus:ring-2 transition ${
                  darkMode
                    ? 'bg-gray-700 text-white placeholder-gray-400 focus:ring-indigo-500'
                    : 'bg-gray-100 text-black placeholder-gray-500 focus:ring-indigo-400'
                }`}
                type="password"
                placeholder= {loading ? 'New Password' : 'New Password'}
                id='newPassword'
                required
                value={password}
              />

              <label htmlFor="confirmPassword" className='my-2'>Confirm Password</label>
              <input
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full p-3 rounded-md focus:outline-none focus:ring-2 transition ${
                  darkMode
                    ? 'bg-gray-700 text-white placeholder-gray-400 focus:ring-indigo-500'
                    : 'bg-gray-100 text-black placeholder-gray-500 focus:ring-indigo-400'
                }`}
                type="password"
                placeholder="Confirm Password"
                id='confirmPassword'
                required
                value={confirmPassword}
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
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </form>
        </section>
    </section>
  )
}

export default ChangePasswordComponent