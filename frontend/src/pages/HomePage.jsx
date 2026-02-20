import React, { useContext, useState } from 'react'
import Sidebar from '../components/Sidebar'
import ChatContainer from '../components/ChatContainer'
import RightSidebar from '../components/RightSidebar'
import { ChatContext } from '../../context/ChatContext'
import { GroupContext } from '../../context/GroupContext'

const HomePage = () => {

  const {selectedUser} = useContext(ChatContext);
  const {selectedGroup} = useContext(GroupContext);
  const [showRightSidebar, setShowRightSidebar] = useState(false);

  // Determine if we have an active chat (individual or group)
  const hasActiveChat = selectedUser || selectedGroup;

  return (
    <div className='border w-full h-screen sm:px-[15%] sm:py-[5%]'>
        <div className={`backdrop-blur-xl border-2  border-gray-600 rounded-2xl
        overflow-hidden h-full grid grid-cols-1 relative 
        ${hasActiveChat 
          ? showRightSidebar 
            ? 'md:grid-cols-[1fr_1.5fr_1fr] xl:grid-cols-[1fr_2fr_1fr]' 
            : 'md:grid-cols-[1fr_2fr] xl:grid-cols-[1fr_2.5fr]'
          : 'md:grid-cols-2'}`}>
            <Sidebar />
            <ChatContainer 
              showRightSidebar={showRightSidebar} 
              setShowRightSidebar={setShowRightSidebar} 
            />
            {showRightSidebar && hasActiveChat && <RightSidebar />}
        </div>
    </div>
  )
}

export default HomePage