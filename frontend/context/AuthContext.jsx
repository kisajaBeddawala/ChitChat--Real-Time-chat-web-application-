import { createContext, useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {io} from "socket.io-client"

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;


export const AuthContext = createContext();

export const AuthProvider = ({children}) => {

    const [token, setToken] = useState(localStorage.getItem("token"));
    const [authUser, setAuthUser] = useState(null);
    const [onlineUser, setOnlineUser] = useState([]);
    const [socket, setSocket] = useState(null);
    const hasCheckedAuth = useRef(false);

    const connectSocket = useCallback((userData)=>{
        if(!userData || socket?.connected)return;
        const newSocket = io(backendUrl, {
            query: {userId: userData._id}
        });
        newSocket.connect();
        setSocket(newSocket);

        newSocket.on("getOnlineUsers", (users) => {
            setOnlineUser(users);
        });
    }, [socket]);

    const checkAuth = useCallback(async () => {
        try{
            const { data } = await axios.get("api/auth/check");
            if(data.success){
                setAuthUser(data.user);
                connectSocket(data.user);
            }
        }catch(error){
            toast.error(error.message);
        }
    }, [connectSocket]);

    const login = async(state,credentials) => {
        try{
            const {data} = await axios.post(`api/auth/${state}`, credentials);
            if(data.success){
                setAuthUser(data.user);
                connectSocket(data.user);
                setToken(data.token);
                localStorage.setItem("token", data.token);
                toast.success(data.message);
            }else{
                toast.error(data.message);
            }
        }catch(error){
            toast.error(error.message);
        }
    }

    const logout = () => {
        localStorage.removeItem("token");
        setAuthUser(null);
        setToken(null);
        setOnlineUser([]);
        axios.defaults.headers.common["token"] = null;
        toast.success("Logged out successfully");
        socket.disconnect();
    }

    const updateProfile = async (body) => {
        try{
            const {data} = await axios.put("api/auth/update-profile", body);
            if(data.success){
                setAuthUser(data.user);
                toast.success("Profile updated successfully");
            }
        }catch(error){
            toast.error(error.message);
        }
    }
    
    useEffect(()=>{
        if(token){
            axios.defaults.headers.common["token"] = token;
            if(!hasCheckedAuth.current){
                hasCheckedAuth.current = true;
                // Defer checkAuth to avoid cascading render warning
                const timer = setTimeout(() => {
                    checkAuth();
                }, 0);
                return () => clearTimeout(timer);
            }
        }
    }, [token, checkAuth])
    
    const value = {
        axios,
        authUser,
        onlineUser,
        socket,
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

