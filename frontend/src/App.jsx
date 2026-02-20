import React, { useContext } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import VideoCall from './components/VideoCall'
import IncomingCallOverlay from './components/IncomingCallOverlay'
import {Toaster} from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext'

const App = () => {
  const {authUser, isLoading} = useContext(AuthContext)
  
  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="bg-[url('/bgImage.svg')] bg-contain h-screen flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[url('/bgImage.svg')] bg-contain">
      <Toaster/>
      <Routes>
        <Route path='/' element={authUser ? <HomePage/> : <Navigate to="/login" />} />
        <Route path='/login' element={!authUser ? <LoginPage/> : <Navigate to="/" />} />
        <Route path='/profile' element={authUser ? <ProfilePage/> : <Navigate to="/login" />} />
      </Routes>
      
      {/* Video Call Components - Only render when user is authenticated */}
      {authUser && (
        <>
          <VideoCall />
          <IncomingCallOverlay />
        </>
      )}
    </div>
  )
}

export default App