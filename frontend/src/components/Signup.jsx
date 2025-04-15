import React, {useState} from 'react'
import { Link } from 'react-router-dom'
import { UserAuth } from '../context/AuthContext'

const Signup = () => {
    const [loading, setLoading] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const {session} = UserAuth();

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        // Simulate a network request
        setTimeout(() => {
            setLoading(false)
            alert('Sign up successful!')
        }, 2000)
    }

  return (
    <section>
        <form className='max-w-md m-auto pt-24'>
            <h2 className='font-bold pb-2'>Sign Up</h2>
            <div className='flex flex-col py-2'>
                <input className='p-3 mt-2 bg-stone-700 rounded-md' type="email" placeholder='Bob@example.com'/>
                <input className='p-3 mt-2 bg-stone-700 rounded-md' type="password" placeholder='Password'/>
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