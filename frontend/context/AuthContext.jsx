import { createContext, useEffect, useState, useCallback, useRef } from "react";
import axios from "../src/lib/axios";
import toast from "react-hot-toast";
import {io} from "socket.io-client"

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;


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
        const newSocket = io(backendUrl, {
            query: {userId: userData._id}
        });
        newSocket.connect();
        setSocket(newSocket);

        newSocket.on("getOnlineUsers", (users) => {
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

