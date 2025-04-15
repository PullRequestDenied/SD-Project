import React, {useState} from 'react'
import { Link } from 'react-router-dom'
import { UserAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const Signup = () => {
    const [loading, setLoading] = useState("");
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const {session, signUpNewUser} = UserAuth();
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await signUpNewUser(email, password, username);
            if (result.success) {
                navigate('/');
            } else {
                setError(result.error.message);
            }
        } catch (error) {
            setError('An error occurred during sign up. Please try again.');
        }finally {
            setLoading(false);
        }
    }

  return (
    <section>
        <form className='max-w-md m-auto pt-24' onSubmit={handleSignup}>
            <h2 className='font-bold pb-2'>Sign Up</h2>
            {error && <p className='text-red-500 text-center pt-4 pb-4'>{error}</p>}
            <div className='flex flex-col py-2'>
                <input onChange={(e) => setUsername(e.target.value)} className='p-3 mt-2 bg-stone-700 rounded-md' type="text" placeholder='Username'/>
                <input onChange={(e) => setEmail(e.target.value)} className='p-3 mt-2 bg-stone-700 rounded-md' type="email" placeholder='Bob@example.com'/>
                <input onChange={(e) => setPassword(e.target.value)} className='p-3 mt-2 bg-stone-700 rounded-md' type="password" placeholder='Password'/>
            </div>
            <button className='mt-6 w-full' type="submit" disabled={loading} >Sign Up</button>
            <p>
                Already have an account? <Link to="/signin">Sign in</Link>
            </p>
        </form>
    </section>
  )
}

export default Signup