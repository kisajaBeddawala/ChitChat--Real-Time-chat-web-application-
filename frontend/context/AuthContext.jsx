import { createContext, useEffect, useState, useCallback, useRef } from "react";
import axios from "../src/lib/axios";
import toast from "react-hot-toast";
import {io} from "socket.io-client"

// Automatically detect backend URL based on current hostname
const getBackendURL = () => {
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    
    console.log('🌐 Current hostname:', hostname);
    
    // If accessing via localhost, use localhost backend
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const url = import.meta.env.VITE_LOCALHOST_BACKEND_URL || 'http://localhost:5001';
      console.log('🏠 Using localhost backend URL:', url);
      return url;
    }
    
    // If accessing via ngrok URL, use ngrok backend
    if (hostname.includes('ngrok') || hostname.includes('tunnels.dev')) {
      const ngrokUrl = import.meta.env.VITE_NGROK_BACKEND_URL;
      if (ngrokUrl) {
        console.log('🌍 Using ngrok backend URL:', ngrokUrl);
        return ngrokUrl;
      }
      console.warn('⚠️ Accessing via ngrok but VITE_NGROK_BACKEND_URL not set!');
    }
    
    // For network access, try ngrok first, then network URL
    const ngrokUrl = import.meta.env.VITE_NGROK_BACKEND_URL;
    if (ngrokUrl) {
      console.log('🌍 Using ngrok backend URL for network access:', ngrokUrl);
      return ngrokUrl;
    }
    
    // Fallback to network backend URL
    const networkUrl = import.meta.env.VITE_NETWORK_BACKEND_URL || `http://${hostname.replace(/:\d+$/, '')}:5001`;
    console.log('🌐 Using network backend URL:', networkUrl);
    return networkUrl;
  }
  
  // Final fallback
  const fallbackUrl = import.meta.env.VITE_LOCALHOST_BACKEND_URL || 'http://localhost:5001';
  console.log('🔄 Using fallback backend URL:', fallbackUrl);
  return fallbackUrl;
};

const backendUrl = getBackendURL();
axios.defaults.baseURL = backendUrl;

// Log the backend URL being used for socket connections
console.log('🔌 Socket connecting to:', backendUrl);


export const AuthContext = createContext();

export const AuthProvider = ({children}) => {

    const [token, setToken] = useState(localStorage.getItem("token"));
    const [authUser, setAuthUser] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [socket, setSocket] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // Add loading state
    const hasCheckedAuth = useRef(false);

    const connectSocket = useCallback((userData)=>{
        if(!userData || socket?.connected)return;
        
        console.log('🔌 Connecting socket with backend URL:', backendUrl);
        console.log('👤 User connecting:', userData._id);
        
        const newSocket = io(backendUrl, {
            query: {userId: userData._id}
        });
        
        newSocket.on("connect", () => {
            console.log('✅ Socket connected successfully');
        });
        
        newSocket.on("connect_error", (error) => {
            console.error('❌ Socket connection error:', error);
        });
        
        newSocket.on("disconnect", (reason) => {
            console.log('🔌 Socket disconnected:', reason);
        });
        
        newSocket.connect();
        setSocket(newSocket);

        newSocket.on("getOnlineUsers", (users) => {
            console.log('👥 Online users updated:', users);
            setOnlineUsers(users);
        });
    }, [socket]);

    const checkAuth = useCallback(async () => {
        try{
            const { data } = await axios.get("api/auth/check");
            if(data.success){
                setAuthUser(data.user);
                localStorage.setItem("userId", data.user._id); // Store user ID
                connectSocket(data.user);
            }
        }catch(error){
            console.log("Auth check failed:", error.message);
            // Don't show error toast on auth failure
        } finally {
            setIsLoading(false); // Always set loading to false
        }
    }, [connectSocket]);

    const login = async(state,credentials) => {
        setIsLoading(true); // Set loading when login starts
        try{
            const {data} = await axios.post(`api/auth/${state}`, credentials);
            if(data.success){
                setAuthUser(data.user);
                connectSocket(data.user);
                setToken(data.token);
                localStorage.setItem("token", data.token);
                localStorage.setItem("userId", data.user._id); // Store user ID for easy access
                toast.success(data.message);
            }else{
                toast.error(data.message);
            }
        }catch(error){
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setIsLoading(false); // Always clear loading
        }
    }

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        setAuthUser(null);
        setToken(null);
        setOnlineUsers([]);
        toast.success("Logged out successfully");
        if (socket) {
            socket.disconnect();
        }
    }

    const updateProfile = async (body) => {
        try{
            const {data} = await axios.put("api/auth/update-profile", body);
            if(data.success){
                setAuthUser(data.user);
                toast.success("Profile updated successfully");
                return data.user;
            } else {
                toast.error(data.message || "Failed to update profile");
                return null;
            }
        }catch(error){
            console.error("Profile update error:", error);
            toast.error(error.response?.data?.message || error.message || "Failed to update profile");
            return null;
        }
    }
    
    useEffect(()=>{
        // Always check auth on mount if token exists
        if(token){
            if(!hasCheckedAuth.current){
                hasCheckedAuth.current = true;
                checkAuth();
            }
        } else {
            setIsLoading(false);
        }
    }, [token, checkAuth])
    
    const value = {
        token,
        authUser,
        onlineUsers,
        socket,
        isLoading, // Add loading state to context
        login,
        logout,
        updateProfile,
    }
    return(
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

