import React, { useContext, useEffect, useRef, useState } from 'react'
import assets from '../assets/assets'
import { formatMessageTimestamp } from '../lib/utils';
import { ChatContext } from '../../context/ChatContext';
import { GroupContext } from '../../context/GroupContext';
import { AuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ChatContainer = () => {

  const {messages, selectedUser, setSelectedUser, sendMessage, getMessages} = useContext(ChatContext)
  const {groupMessages, selectedGroup, setSelectedGroup, sendGroupMessage, getGroupMessages} = useContext(GroupContext)
  const {authUser, onlineUsers} = useContext(AuthContext)

  const scrollEnd = useRef();

  const [input, setInput] = useState("")

  // Determine current chat type and data
  const isGroupChat = !!selectedGroup;
  const currentMessages = isGroupChat ? groupMessages : messages;
  const currentChat = isGroupChat ? selectedGroup : selectedUser;

  const handleSendMessage = async(e) => {
    e.preventDefault();
    if(input.trim() === "") return;
    
    if (isGroupChat) {
      await sendGroupMessage({text: input.trim()});
    } else {
      await sendMessage({text: input.trim()});
    }
    setInput("");
  }

  const handleSendImage = async(e) => {
    const file = e.target.files[0];
    if(!file || !file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async() => {
      if (isGroupChat) {
        await sendGroupMessage({image: reader.result});
      } else {
        await sendMessage({image: reader.result});
      }
      e.target.value = "";
    }
    reader.readAsDataURL(file);
  }

  const handleBackClick = () => {
    if (isGroupChat) {
      setSelectedGroup(null);
    } else {
      setSelectedUser(null);
    }
  }

  useEffect(() => {
    if(selectedUser){
      getMessages(selectedUser._id);
    }
  },[selectedUser])

  useEffect(() => {
    if(selectedGroup){
      getGroupMessages(selectedGroup._id);
    }
  },[selectedGroup])

  useEffect(() => {
    if(scrollEnd.current && currentMessages.length > 0){
      scrollEnd.current.scrollIntoView({behavior: 'smooth'});
    }
  },[currentMessages])

  // Helper function to get sender info for messages
  const getSenderInfo = (message) => {
    if (isGroupChat) {
      return {
        profilePic: message.senderId.profilePic,
        name: message.senderId.fullName,
        isMe: message.senderId._id === authUser._id
      };
    } else {
      const isMe = message.senderId === authUser._id;
      return {
        profilePic: isMe ? authUser?.profilePic : selectedUser?.profilePic,
        name: isMe ? authUser?.fullName : selectedUser?.fullName,
        isMe
      };
    }
  };

  return currentChat ?(
    <div className='h-full overflow-scroll relative backdrop-blur-lg'>
      {/* Chat Header */}
      <div className='flex items-center gap-3 py-3 mx-4 border-b border-stone-500'>
        {isGroupChat ? (
          <>
            {selectedGroup.groupImage ? (
              <img src={selectedGroup.groupImage} alt="" className='w-8 h-8 rounded-full object-cover'/>
            ) : (
              <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            )}
            <div className='flex-1'>
              <p className='text-lg text-white font-medium'>{selectedGroup.groupName}</p>
              <p className='text-xs text-gray-400'>{selectedGroup.members.length} members</p>
            </div>
          </>
        ) : (
          <>
            <img src={selectedUser.profilePic || assets.avatar_icon} alt="" className='w-8 h-8 rounded-full object-cover'/>
            <p className='flex-1 text-lg text-white flex items-center gap-2'>
              {selectedUser.fullName}
              {onlineUsers.includes(selectedUser._id) && <span className='w-2 h-2 bg-green-500 rounded-full'></span>}
            </p>
          </>
        )}
        <img onClick={handleBackClick} src={assets.arrow_icon} alt="" className='md:hidden max-w-7 cursor-pointer'/>
        <img src={assets.help_icon} alt="" className='max-md:hidden max-w-5'/>
      </div>

      {/* Messages Container */}
      <div className='flex flex-col h-[calc(100%-120px)] overflow-scroll p-3 pb-6'>
        {currentMessages.map((message,index) => {
          const senderInfo = getSenderInfo(message);
          return (
            <div key={index} className={`flex items-end gap-2 mb-4 ${senderInfo.isMe ? 'justify-end' : 'justify-start'}`}> 
              {/* Message Content */}
              <div className={`flex flex-col ${senderInfo.isMe ? 'items-end' : 'items-start'}`}>
                {/* Group chat: show sender name if not current user */}
                {isGroupChat && !senderInfo.isMe && (
                  <p className="text-xs text-gray-400 mb-1 px-2">{senderInfo.name}</p>
                )}
                
                {message.image ? (
                  <img 
                    src={message.image} 
                    alt="" 
                    className='max-w-57.5 border border-gray-700 rounded-lg overflow-hidden'
                  />
                ) : (
                  <p className={`max-w-50 md:text-sm font-light rounded-lg px-3 py-2 break-words ${
                    senderInfo.isMe 
                      ? 'bg-violet-500 text-white rounded-br-none' 
                      : 'bg-gray-600 text-white rounded-bl-none'
                  }`}>
                    {message.text}
                  </p>
                )}
              </div>
              
              {/* Sender Avatar and Time */}
              <div className='flex flex-col items-center text-center text-xs'>
                <img 
                  src={senderInfo.profilePic || assets.avatar_icon} 
                  alt="" 
                  className='w-7 h-7 rounded-full object-cover' 
                />
                <p className='text-gray-500 mt-1'>{formatMessageTimestamp(message.createdAt)}</p>
              </div>
            </div>
          )
        })}
        <div ref={scrollEnd}></div>
      </div>

      {/* Message Input */}
      <div className='absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3 bg-[#8185B2]/5' >
        <div className='flex-1 flex items-center bg-gray-100/12 px-3 rounded-full'>
          <input 
            onChange={(e) => setInput(e.target.value)}  
            value={input} 
            onKeyDown={(e) => e.key === "Enter" ? handleSendMessage(e) : null} 
            type="text" 
            placeholder={isGroupChat ? `Message ${selectedGroup.groupName}` : 'Send a message'} 
            className='flex-1 text-sm p-3 border-none outline-none text-white placeholder-gray-400 bg-transparent'
          />
          <input onChange={handleSendImage} type="file" id='image' accept='image/png, image/jpeg' hidden />
          <label htmlFor="image">
            <img src={assets.gallery_icon} alt="" className='w-5 mr-2 cursor-pointer' />
          </label>
        </div>
        <img onClick={handleSendMessage} src={assets.send_button} alt="" className='w-7 cursor-pointer'/>
      </div>
    </div>
  ):(
    <div className='flex flex-col items-center justify-center h-full gap-4 text-gray-500 bg-white/10 max-md:hidden'>
      <img src={assets.logo_icon} alt="" className='max-w-16'/>
      <p className='text-lg font-medium text-white'>Chat anywhere with ChitChat</p>
      <p className='text-sm text-gray-400'>Select a user or group to start messaging</p>
    </div>
  )
}

export default ChatContainer