import React, {useState} from 'react'
import { Link } from 'react-router-dom'
import { UserAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const Signin = () => {
    const [loading, setLoading] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const {signInUser} = UserAuth();
    const navigate = useNavigate();

    const handleSignIn = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await signInUser(email, password);
            if (result.success) {
                navigate('/Dashboard');
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
        <form className='max-w-md m-auto pt-24' onSubmit={handleSignIn}>
            <h2 className='font-bold pb-2 text-center text-2xl'>Sign In</h2>
            {error && <p className='text-red-500 text-center pt-4 pb-4'>{error}</p>}
            <div className='flex flex-col py-2'>
                <label className='font-bold mb-1'>Email</label>
                <input onChange={(e) => setEmail(e.target.value)} className='p-3 mb-2 bg-stone-700 rounded-md' type="email" placeholder='Bob@example.com'/>
                <label className='font-bold mb-1'>Password</label>
                <input onChange={(e) => setPassword(e.target.value)} className='p-3 bg-stone-700 rounded-md' type="password" placeholder='Password123'/>
            </div>
            <button className='mt-6 w-full' type="submit" disabled={loading} >Sign In</button>
            <p className='mt-3'>
                Don't have an account? <Link to="/signup">Sign Up</Link>
            </p>
        </form>
    </section>
  )
}

export default Signin