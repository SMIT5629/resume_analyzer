import React from 'react'
import "../auth.form.scss"
import { Link } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import Loading from "../../shared/components/Loading"

function Login() {

    const { loading, handleLogin } = useAuth()
    const nevigate = useNavigate()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault();
        await handleLogin({ email, password })
        nevigate("/")

    }
    if (loading) {
        return (
           <Loading/>
        )
    }
    return (
        <main>
            <div className="form-container">
                <h2>Login</h2>
                <form action="" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            onChange={(e) => { setEmail(e.target.value) }}
                            type="email" id="email" name='email' placeholder='Email' />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            onChange={(e) => { setPassword(e.target.value) }}
                            type="password" id="password" name='password' placeholder='Password' />
                    </div>
                    <button type='submit' className='button primary-button'>Login</button>
                </form>
                <p>Don't have an account ?  <Link to="/register">Register</Link></p>
            </div>
        </main>
    )
}

export default Login