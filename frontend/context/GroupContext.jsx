import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";
import axios from "../src/lib/axios";

export const GroupContext = createContext();

export const GroupProvider = ({children}) => {  
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [groupMessages, setGroupMessages] = useState([]);
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
    const [users, setUsers] = useState([]);

    const {socket} = useContext(AuthContext); 

    // Get all groups for the current user
    const getGroups = useCallback(async () => {
        try{
            const {data} = await axios.get("api/groups");
            if(data.success){
                setGroups(data.groups);
            }
        }catch(error){
            toast.error(error.response?.data?.message || error.message);
        }
    }, []);

    // Get all users for adding to groups
    const getAllUsers = useCallback(async () => {
        try{
            const {data} = await axios.get("api/messages/users");
            if(data.success){
                setUsers(data.users);
            } else {
                console.error("Failed to get users:", data.message);
            }
        }catch(error){
            console.error("Get users error:", error);
            toast.error(error.response?.data?.message || "Failed to load users");
        }
    }, []);

    // Create a new group
    const createGroup = useCallback(async (groupData) => {
        try{
            const {data} = await axios.post("api/groups/create", groupData);
            if(data.success){
                setGroups(prev => [data.group, ...prev]);
                toast.success("Group created successfully!");
                setShowCreateGroupModal(false);
                return data.group;
            } else {
                toast.error(data.message);
            }
        }catch(error){
            toast.error(error.response?.data?.message || error.message);
        }
    }, []);

    // Get group messages
    const getGroupMessages = useCallback(async (groupId) => {
        try{
            const {data} = await axios.get(`api/messages/group/${groupId}`);
            if(data.success){
                setGroupMessages(data.messages);
            }
        }catch(error){
            toast.error(error.response?.data?.message || error.message);
        }
    }, []);

    // Send message to group
    const sendGroupMessage = useCallback(async (messageData) => {
        try{
            const {data} = await axios.post(`api/messages/send/group/${selectedGroup._id}`, messageData);
            if(!data.success){
                toast.error(data.message);
            }
            // Don't manually add message here - let socket handle it to prevent duplicates
        }catch(error){
            toast.error(error.response?.data?.message || error.message);
        }
    }, [selectedGroup]);

    // Update group details
    const updateGroup = useCallback(async (groupId, updateData) => {
        try{
            const {data} = await axios.put(`api/groups/${groupId}/update`, updateData);
            if(data.success){
                setGroups(prev => prev.map(group => 
                    group._id === groupId ? data.group : group
                ));
                if(selectedGroup && selectedGroup._id === groupId) {
                    setSelectedGroup(data.group);
                }
                toast.success("Group updated successfully!");
            }else{
                toast.error(data.message);
            }
        }catch(error){
            toast.error(error.response?.data?.message || error.message);
        }
    }, [selectedGroup]);

    // Add members to group
    const addMembersToGroup = useCallback(async (groupId, memberIds) => {
        try{
            const {data} = await axios.put(`api/groups/${groupId}/add-members`, {members: memberIds});
            if(data.success){
                setGroups(prev => prev.map(group => 
                    group._id === groupId ? data.group : group
                ));
                if(selectedGroup && selectedGroup._id === groupId) {
                    setSelectedGroup(data.group);
                }
                toast.success("Members added successfully!");
            }else{
                toast.error(data.message);
            }
        }catch(error){
            toast.error(error.response?.data?.message || error.message);
        }
    }, [selectedGroup]);

    // Remove member from group
    const removeMemberFromGroup = useCallback(async (groupId, memberId) => {
        try{
            const {data} = await axios.put(`api/groups/${groupId}/remove-member`, {memberId});
            if(data.success){
                setGroups(prev => prev.map(group => 
                    group._id === groupId ? data.group : group
                ));
                if(selectedGroup && selectedGroup._id === groupId) {
                    setSelectedGroup(data.group);
                }
                toast.success("Member removed successfully!");
            }else{
                toast.error(data.message);
            }
        }catch(error){
            toast.error(error.response?.data?.message || error.message);
        }
    }, [selectedGroup]);

    // Delete group
    const deleteGroup = useCallback(async (groupId) => {
        try{
            const {data} = await axios.delete(`api/groups/${groupId}`);
            if(data.success){
                setGroups(prev => prev.filter(group => group._id !== groupId));
                if(selectedGroup && selectedGroup._id === groupId) {
                    setSelectedGroup(null);
                    setGroupMessages([]);
                }
                toast.success("Group deleted successfully!");
            }else{
                toast.error(data.message);
            }
        }catch(error){
            toast.error(error.response?.data?.message || error.message);
        }
    }, [selectedGroup]);

    // Socket listeners for real-time group updates
    useEffect(() => {
        if(!socket) return;

        const handleGroupCreated = (newGroup) => {
            setGroups(prev => [newGroup, ...prev]);
            toast.success(`You were added to group: ${newGroup.groupName}`);
        };

        const handleGroupUpdated = (updatedGroup) => {
            setGroups(prev => prev.map(group => 
                group._id === updatedGroup._id ? updatedGroup : group
            ));
            if(selectedGroup && selectedGroup._id === updatedGroup._id) {
                setSelectedGroup(updatedGroup);
            }
        };

        const handleGroupDeleted = ({ groupId }) => {
            setGroups(prev => prev.filter(group => group._id !== groupId));
            if(selectedGroup && selectedGroup._id === groupId) {
                setSelectedGroup(null);
                setGroupMessages([]);
            }
            toast.info("A group you were in has been deleted");
        };

        const handleNewGroupMessage = (newMessage) => {
            if(selectedGroup && newMessage.groupId === selectedGroup._id){
                setGroupMessages((prev) => [...prev, newMessage]);
            }
        };

        socket.on("groupCreated", handleGroupCreated);
        socket.on("groupUpdated", handleGroupUpdated);
        socket.on("groupDeleted", handleGroupDeleted);
        socket.on("newGroupMessage", handleNewGroupMessage);

        return () => {
            socket.off("groupCreated", handleGroupCreated);
            socket.off("groupUpdated", handleGroupUpdated);
            socket.off("groupDeleted", handleGroupDeleted);
            socket.off("newGroupMessage", handleNewGroupMessage);
        };
    }, [socket, selectedGroup]);

    const value = {
        groups,
        selectedGroup,
        groupMessages,
        users,
        showCreateGroupModal,
        getGroups,
        getAllUsers,
        createGroup,
        getGroupMessages,
        sendGroupMessage,
        updateGroup,
        addMembersToGroup,
        removeMemberFromGroup,
        deleteGroup,
        setSelectedGroup,
        setShowCreateGroupModal,
        setGroupMessages
    };

    return (
        <GroupContext.Provider value={value}>
            {children}
        </GroupContext.Provider>
    );
};