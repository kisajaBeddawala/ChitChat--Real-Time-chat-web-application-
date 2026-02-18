import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";
import axios from "../src/lib/axios";

export const ChatContext = createContext();

export const ChatProvider = ({children}) => {  

    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({});

    const {socket} = useContext(AuthContext); 

    const getUsers = useCallback(async () => {
        try{
            const {data} = await axios.get("api/messages/users");
            if(data.success){
                setUsers(data.users);
                setUnseenMessages(data.unseenMessages);
            }
        }catch(error){
            toast.error(error.message);
        }
    }, []); // Remove unnecessary dependencies

    const getMessages = useCallback(async (userId) => {
        try{
            const {data} = await axios.get(`api/messages/${userId}`);
            if(data.success){
                setMessages(data.messages);
            }
        }catch(error){
            toast.error(error.message);
        }
    }, []);

    const sendMessage = useCallback(async (messageData) => {
        try{
            const {data} = await axios.post(`api/messages/send/${selectedUser._id}`, messageData);
            if(data.success){
                setMessages((prev) => [...prev, data.message]);
            }else{
                toast.error(data.message);
            }
        }catch(error){
            toast.error(error.message);
        }
    }, [selectedUser]);

    // Optimize socket listeners - only recreate when socket changes
    useEffect(() => {
        if(!socket) return;

        const handleNewMessage = (newMessage) => {
            if(selectedUser && newMessage.senderId === selectedUser._id){
                newMessage.seen = true;
                setMessages((prev) => [...prev, newMessage]);
                axios.put(`api/messages/mark/${newMessage._id}`);
            }else{
                setUnseenMessages((prev) => ({
                    ...prev, [newMessage.senderId]: 
                    prev[newMessage.senderId] ? 
                    prev[newMessage.senderId] + 1 : 1
                }))
            }
        }

        socket.on("newMessage", handleNewMessage);
        return () => socket.off("newMessage", handleNewMessage);
    }, [socket, selectedUser]);

    const value = {
        messages,
        users,
        selectedUser,
        getUsers,
        getMessages,
        sendMessage,
        setSelectedUser,
        unseenMessages,
        setUnseenMessages
    }
    return (
    <ChatContext.Provider value={value}>
        {children}
    </ChatContext.Provider>
    )
}