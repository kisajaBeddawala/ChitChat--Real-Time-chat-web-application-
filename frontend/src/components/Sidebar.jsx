import React, { useContext, useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { ChatContext } from '../../context/ChatContext'
import { GroupContext } from '../../context/GroupContext'
import { useVideoCall } from '../../context/VideoCallContext'
import { VideoCameraIcon } from '@heroicons/react/24/solid'
import assets from '../assets/assets'
import CreateGroup from './CreateGroup'

const Sidebar = () => {
    const {getUsers, users, selectedUser, setSelectedUser, unseenMessages, setUnseenMessages} = useContext(ChatContext)
    const {getGroups, groups, selectedGroup, setSelectedGroup, setShowCreateGroupModal} = useContext(GroupContext)
    const {logout, onlineUsers, authUser} = useContext(AuthContext)
    const {startCall, isCallActive, isOutgoingCall} = useVideoCall();

    const [input, setInput] = useState("");
    const [activeTab, setActiveTab] = useState("users"); // "users" or "groups"

    const navigate = useNavigate();

    // Memoize filtered users for better performance
    const filteredUsers = useMemo(() => {
        if (!input.trim()) return users || [];
        return (users || []).filter((user) => 
            user.fullName.toLowerCase().includes(input.toLowerCase())
        );
    }, [users, input]);

    // Memoize filtered groups for better performance
    const filteredGroups = useMemo(() => {
        if (!input.trim()) return groups || [];
        return (groups || []).filter((group) => 
            group.groupName.toLowerCase().includes(input.toLowerCase())
        );
    }, [groups, input]);

    // Load users and groups on mount
    useEffect(() => {
        if (users.length === 0) {
            getUsers();
        }
        if (groups.length === 0) {
            getGroups();
        }
    }, [getUsers, getGroups, users.length, groups.length]);

    const handleUserSelect = (user) => {
        setSelectedUser(user);
        setSelectedGroup(null); // Clear group selection
        setUnseenMessages(prev => ({...prev, [user._id]: 0}));
    };

    const handleGroupSelect = (group) => {
        setSelectedGroup(group);
        setSelectedUser(null); // Clear user selection
    };

    const handleVideoCall = (e, user) => {
        e.stopPropagation(); // Prevent user selection when clicking video call
        startCall(user._id, user);
    };

  return (
    <div className={`bg-[#8185B2]/10 h-full p-5 rounded-r-xl overflow-y-scroll
    text-white ${(selectedUser || selectedGroup) ? 'max-md:hidden' : ''}`}>
        <div className='pb-5'>
            <div className='flex justify-between items-center'>
                <img src={assets.logo} alt="Logo" className='max-w-40'/>
                <div className='relative py-2 group'>
                    <img src={assets.menu_icon} alt="Menu" className='max-h-5 cursor-pointer' />
                    <div className='absolute top-full right-0 z-20 w-32 p-5 rounded-md bg-[#282142] border border-gray-600 text-gray-100 hidden group-hover:block'>
                        <p onClick={() => navigate('/profile')} className='cursor-pointer text-sm'>Edit Profile</p>
                        <hr className='my-2 border-t border-gray-500'/>
                        <p onClick={() => logout()} className='cursor-pointer text-sm'>Logout</p>
                    </div>
                </div>
            </div>

            {/* Tab Switcher */}
            <div className='flex bg-[#282142] rounded-full p-1 mt-5'>
                <button 
                    onClick={() => setActiveTab("users")}
                    className={`flex-1 py-2 px-3 rounded-full text-xs font-medium transition-colors ${
                        activeTab === "users" 
                            ? 'bg-violet-500 text-white' 
                            : 'text-gray-400 hover:text-white'
                    }`}
                >
                    Users
                </button>
                <button 
                    onClick={() => setActiveTab("groups")}
                    className={`flex-1 py-2 px-3 rounded-full text-xs font-medium transition-colors ${
                        activeTab === "groups" 
                            ? 'bg-violet-500 text-white' 
                            : 'text-gray-400 hover:text-white'
                    }`}
                >
                    Groups
                </button>
            </div>

            <div className='bg-[#282142] rounded-full flex items-center gap-2 py-3 px-4 mt-3'>
                <img src={assets.search_icon} alt="Search" className='w-3'/>
                <input 
                    onChange={(e) => setInput(e.target.value)} 
                    type="text" 
                    className='bg-transparent border-none outline-none text-white text-xs placeholder-[#c8c8c8] flex-1' 
                    placeholder={activeTab === "users" ? 'Search Users...' : 'Search Groups...'}
                />
            </div>

            {/* Create Group Button */}
            {activeTab === "groups" && (
                <button
                    onClick={() => setShowCreateGroupModal(true)}
                    className='w-full mt-3 py-2 px-4 bg-violet-500 hover:bg-violet-600 rounded-full text-white text-sm font-medium transition-colors flex items-center justify-center gap-2'
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Group
                </button>
            )}
        </div>

        <div className='flex flex-col'>
            {activeTab === "users" ? (
                // Users List
                filteredUsers.map((user,index) => (
                    <div key={index} className={`relative group flex items-center gap-2 p-2 pl-4 rounded cursor-pointer max-sm:text-sm ${selectedUser?._id === user._id && 'bg-[#282142]/10'}`}>
                        <div onClick={() => handleUserSelect(user)} className="flex items-center gap-2 flex-1">
                            <img src={user.profilePic || assets.avatar_icon} alt="" className='w-8.75 aspect-square rounded-full object-cover'/>
                            <div className='flex flex-col leading-5'>
                                <p>{user.fullName}</p>
                                {
                                    (onlineUsers || []).includes(user._id)
                                    ? <span className='text-green-400 text-xs'>Online</span>
                                    : <span className='text-neutral-400 text-xs'>Offline</span>
                                }
                            </div>
                        </div>
                        
                        {/* Video Call Button - Only show for online users */}
                        {(onlineUsers || []).includes(user._id) && !isCallActive && !isOutgoingCall && (
                            <button
                                onClick={(e) => handleVideoCall(e, user)}
                                className="opacity-0 group-hover:opacity-100 p-2 rounded-full bg-violet-500/20 hover:bg-violet-500/40 transition-all duration-200"
                                title="Start Video Call"
                            >
                                <VideoCameraIcon className="w-4 h-4 text-violet-400" />
                            </button>
                        )}
                        
                        {/* Unseen Messages Badge */}
                        {unseenMessages[user._id] > 0 && 
                            <p className='absolute top-4 right-4 text-xs h-5 w-5 flex justify-center items-center rounded-full bg-violet-500/50'>
                                {unseenMessages[user._id]}
                            </p>
                        }
                    </div>
                ))
            ) : (
                // Groups List
                filteredGroups.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="text-gray-400 mb-2">
                            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <p className="text-gray-400 text-sm">No groups found</p>
                        <p className="text-gray-500 text-xs mt-1">Create a group to get started</p>
                    </div>
                ) : (
                    filteredGroups.map((group, index) => (
                        <div onClick={() => handleGroupSelect(group)} key={index} className={`relative flex items-center gap-2 p-2 pl-4 rounded cursor-pointer max-sm:text-sm ${selectedGroup?._id === group._id && 'bg-[#282142]/10'}`}>
                            <div className="relative">
                                {group.groupImage ? (
                                    <img src={group.groupImage} alt="" className='w-8.75 aspect-square rounded-full object-cover'/>
                                ) : (
                                    <div className="w-8.75 aspect-square rounded-full bg-violet-500/20 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <div className='flex flex-col leading-5 flex-1'>
                                <p className="font-medium">{group.groupName}</p>
                                <div className="flex items-center gap-1">
                                    <span className='text-neutral-400 text-xs'>{group.members.length} member{group.members.length !== 1 ? 's' : ''}</span>
                                </div>
                            </div>
                            {/* Group admin indicator */}
                            {group.admin._id === authUser?._id && (
                                <div className="text-yellow-400 text-xs">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    ))
                )
            )}
        </div>

        <CreateGroup />
    </div>
  )
}

export default Sidebar