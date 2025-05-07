import React, { use, useEffect } from 'react'
import { useDarkMode } from '../context/DarkModeContext';
import { UserAuth } from '../context/AuthContext';

const AccountInfoComponent = () => {

    const { darkMode, toggleDarkMode } = useDarkMode();
    const [loading, setLoading] = React.useState(false);
    const [email, setEmail] = React.useState("");
    const [username, setUsername] = React.useState("");
    const [edit, setEdit] = React.useState(false);
    const {session, updateUsernameAndEmail} = UserAuth();

    useEffect(() => {
        setEmail(session?.user?.email);
        setUsername(session?.user?.user_metadata?.display_name);
    },[])

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            if (username === "") {
                setUsername(session?.user?.user_metadata?.display_name);
            }
            if (email === "") {
                setEmail(session?.user?.email);
            }

            updateUsernameAndEmail(username, email)
        } catch (error) {
            console.error("Error updating user info:", error);
        } finally {
            setEdit(!edit);
        }
    }

  return (
    
    <section className='flex justify-center transition-colors'>
        <div className={`relative z-10 w-xl px-6 py-12 rounded-md transition-all duration-300 ease-in-out border border-transparent hover:border-indigo-400 ${
                  darkMode
                  ? 'bg-gray-800 border-gray-700 '
                  : 'bg-white border-gray-200 '
                }`}>
            
            <form className="space-y-4">

                <label htmlFor="username" className='my-2'>Username</label>
                <input
                    onChange={(e) => setUsername(e.target.value)}
                    className={`w-full p-3 rounded-md focus:outline-none focus:ring-2 transition ${
                    darkMode
                        ? 'bg-gray-700 text-white placeholder-gray-400 focus:ring-indigo-500'
                        : 'bg-gray-100 text-black placeholder-gray-500 focus:ring-indigo-400'
                    }`}
                    type="text"
                    placeholder={username}
                    id='username'
                    disabled={!edit}
                />

                <label htmlFor="email" className='py-2'>Email</label>
                <input
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full p-3 rounded-md focus:outline-none focus:ring-2 transition ${
                    darkMode
                        ? 'bg-gray-700 text-white placeholder-gray-400 focus:ring-indigo-500'
                        : 'bg-gray-100 text-black placeholder-gray-500 focus:ring-indigo-400'
                    }`}
                    type="email"
                    placeholder={email}
                    id='email'
                    disabled={!edit}
                />
              
                <div className='flex flex-col justify-between items-end'>
                    {edit ? (
                        <button
                        className={`py-3 rounded-md text-sm font-medium transition ${
                        darkMode
                            ? 'hover:!border-cyan-600 text-white'
                            : 'hover:!bg-sky-700 text-white'
                        }`}
                        type="button"
                        onClick={handleUpdate}>
                        Save
                    </button>
                    ):(
                    <button
                        className={`py-3 rounded-md text-sm font-medium transition ${
                        darkMode
                            ? 'hover:!border-cyan-600 text-white'
                            : 'hover:!bg-sky-700 text-white'
                        }`}
                        onClick={() => setEdit(!edit)}
                        type="button">
                        Edit
                    </button>
                    )}
                </div>
            </form>
        </div>

    </section>
  )
}

export default AccountInfoComponent