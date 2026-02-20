import React, { useContext, useState } from 'react'
import assets from '../assets/assets'
import { ChatContext } from '../../context/ChatContext';
import { GroupContext } from '../../context/GroupContext';
import { AuthContext } from '../../context/AuthContext';

const RightSidebar = () => {

  const {selectedUser, messages} = useContext(ChatContext);
  const {selectedGroup, groupMessages} = useContext(GroupContext);
  const {logout, onlineUsers, authUser} = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('members'); // 'members' or 'media'

  // Determine current chat type and data
  const isGroupChat = !!selectedGroup;
  const currentChat = isGroupChat ? selectedGroup : selectedUser;
  const currentMessages = isGroupChat ? groupMessages : messages;

  // Derive msgImages directly instead of using state
  const msgImages = currentMessages.filter((msg) => msg.image).map((msg) => msg.image);

  return currentChat &&(
    <div className={`bg-[#8185B2]/10 text-white w-full relative overflow-y-scroll ${currentChat ? "max:md:hidden" : ""}`}>
      {/* Header Section */}
      <div className='pt-16 flex flex-col items-center gap-2 text-xs font-light mx-auto'>
        {isGroupChat ? (
          // Group Header
          <>
            {selectedGroup.groupImage ? (
              <img src={selectedGroup.groupImage} alt="" className='w-20 aspect-square rounded-full object-cover'/>
            ) : (
              <div className="w-20 h-20 rounded-full bg-violet-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            )}
            <h1 className='px-10 text-xl font-medium mx-auto text-center'>
              {selectedGroup.groupName}
            </h1>
            <p className='px-10 mx-auto text-gray-400'>
              {selectedGroup.members.length} members
            </p>
            {selectedGroup.description && (
              <p className='px-10 mx-auto text-sm text-gray-300 text-center'>
                {selectedGroup.description}
              </p>
            )}
          </>
        ) : (
          // Individual User Header
          <>
            <img src={selectedUser?.profilePic || assets.avatar_icon} alt="" className='w-20 aspect-square rounded-full object-cover'/>
            <h1 className='px-10 text-xl font-medium mx-auto flex items-center gap-2'>
              {onlineUsers.includes(selectedUser._id) && <p className='w-2 h-2 rounded-full bg-green-500'></p>}
              {selectedUser.fullName}
            </h1>
            <p className='px-10 mx-auto text-gray-400'>{selectedUser.email}</p>
          </>
        )}
      </div>

      <hr className='border-[#ffffff50] my-4'/>

      {/* Tabs for Group Chat */}
      {isGroupChat && (
        <div className='px-5 mb-4'>
          <div className='flex border-b border-gray-600'>
            <button 
              onClick={() => setActiveTab('members')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'members' 
                  ? 'text-violet-400 border-b-2 border-violet-400' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Members
            </button>
            <button 
              onClick={() => setActiveTab('media')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'media' 
                  ? 'text-violet-400 border-b-2 border-violet-400' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Media
            </button>
          </div>
        </div>
      )}

      {/* Content Section */}
      <div className='px-5 text-xs flex-1'>
        {isGroupChat ? (
          // Group Content
          <>
            {activeTab === 'members' ? (
              // Members Tab
              <div>
                <p className='text-gray-400 mb-3'>Group Members ({selectedGroup.members.length})</p>
                <div className='space-y-3 max-h-60 overflow-y-scroll'>
                  {selectedGroup.members.map((member) => (
                    <div key={member._id} className='flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700/30'>
                      <img 
                        src={member.profilePic || assets.avatar_icon} 
                        alt="" 
                        className='w-10 h-10 rounded-full object-cover'
                      />
                      <div className='flex-1'>
                        <p className='text-white font-medium'>
                          {member.fullName}
                          {member._id === selectedGroup.admin && (
                            <span className='ml-2 text-xs text-yellow-400 bg-yellow-400/20 px-2 py-1 rounded-full'>
                              Admin
                            </span>
                          )}
                          {member._id === authUser._id && (
                            <span className='ml-2 text-xs text-blue-400'>
                              (You)
                            </span>
                          )}
                        </p>
                        <p className='text-gray-400 text-xs'>{member.email}</p>
                      </div>
                      {onlineUsers.includes(member._id) && (
                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Media Tab
              <div>
                <p className='text-gray-400 mb-3'>Shared Media ({msgImages.length})</p>
                <div className='max-h-60 overflow-y-scroll'>
                  {msgImages.length > 0 ? (
                    <div className='grid grid-cols-2 gap-2 opacity-80'>
                      {msgImages.map((url, index) => (
                        <div key={index} onClick={() => window.open(url)} className='cursor-pointer rounded'>
                          <img src={url} alt="" className='w-full h-20 object-cover rounded-md hover:opacity-80 transition-opacity'/>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className='text-gray-500 text-center py-8'>No media shared yet</p>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          // Individual User Media
          <div>
            <p className='text-gray-400 mb-3'>Shared Media ({msgImages.length})</p>
            <div className='max-h-60 overflow-y-scroll'>
              {msgImages.length > 0 ? (
                <div className='grid grid-cols-2 gap-2 opacity-80'>
                  {msgImages.map((url, index) => (
                    <div key={index} onClick={() => window.open(url)} className='cursor-pointer rounded'>
                      <img src={url} alt="" className='w-full h-20 object-cover rounded-md hover:opacity-80 transition-opacity'/>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-gray-500 text-center py-8'>No media shared yet</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Logout Button */}
      <button onClick={() => logout()} className='absolute bottom-5 left-1/2 transform -translate-x-1/2
       bg-gradient-to-r from-purple-400 to-violet-600 rounded-full text-white border-none px-20 text-sm py-2 cursor-pointer hover:scale-105 transition-all duration-300 ease-in-out'>
        Logout
      </button>
    </div>
  )
}

export default RightSidebar