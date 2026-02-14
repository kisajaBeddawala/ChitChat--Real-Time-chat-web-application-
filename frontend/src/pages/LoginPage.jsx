import React, { useContext, useState } from 'react'
import assets from '../assets/assets'
import { AuthContext } from '../../context/AuthContext';

const LoginPage = () => {

  const [currState, setCurrState] = useState("Sign Up");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [isDataSubmitted, setIsDataSubmitted] = useState(false);

  const {login} = useContext(AuthContext)

  const onSubmitHandler = (e) => {
    e.preventDefault();
    if(currState === "Sign Up" && !isDataSubmitted){
      setIsDataSubmitted(true);
      return;
    }
    login(currState === "Sign Up" ? 'signup' : 'login', {fullName, email, password, bio});
  }

  return (
    <div className='min-h-screen bg-cover bg-center flex items-center justify-center gap-8 sm:justify-evenly max-sm:flex-col backdrop-blur-2xl'>
        <img src={assets.logo_big} alt="" className='w-[min(30vw,250px)]'/>

        <form onSubmit={onSubmitHandler} className='w-[min(30vw,400px)] border-2 bg-white/8 text-white border-gray-500 p-6 flex flex-col gap-5 rounded-lg shadow-lg'>
          <h2 className='font-medium text-2xl flex justify-between items-center'>
            {currState}
            {isDataSubmitted &&
            <img src={assets.arrow_icon} onClick={() => setIsDataSubmitted(false)} alt="" className='w-5 cursor-pointer' />
            }
          </h2>

          {currState === "Sign Up" && !isDataSubmitted && (
            <input onChange={(e) => setFullName(e.target.value)} value={fullName} type="text" className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'  placeholder='Full Name' required />
          )}

          {!isDataSubmitted && (
            <>
            <input onChange={(e) => setEmail(e.target.value)} value={email} type="email" className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'  placeholder='Email' required />
            <input onChange={(e) => setPassword(e.target.value)} value={password} type="password" className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'  placeholder='Password' required />
            </>
          )}

          {currState === "Sign Up" && isDataSubmitted && (
            <textarea onChange={(e) => setBio(e.target.value)} value={bio} rows={4} className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'  placeholder='Short Bio' required />
          )}

          <button type='submit' className='py-3 bg-linear-to-r from-purple-400 to-violet-600 text-white rounded-md cursor-pointer'>
            {currState === "Sign Up" ? "Create Account" :  "Login Now"}
          </button>
          
          <div className='flex items-center gap-2 text-sm text-gray-500'>
            <input type="checkbox" />
            <p>Agree to terms and conditions</p>
          </div>

          <div className="flex flex-col items-center justify-center gap-2">
            {currState === "Sign Up" ? (
              <p className='text-sm text-gray-400'>Already have an account? 
                <span onClick={() => {
                  setCurrState("Login"); setIsDataSubmitted(false);
                }} className='text-violet-500 font-medium cursor-pointer'> Login</span>
              </p>
            ) : (
              <p className='text-sm text-gray-400'>Don't have an account? 
                <span onClick={() => {
                  setCurrState("Sign Up"); setIsDataSubmitted(false);
                }} className='text-violet-500 font-medium cursor-pointer'> Sign Up</span>
              </p>
            )}
          </div>
        </form>
    </div>
  )
}

export default LoginPage