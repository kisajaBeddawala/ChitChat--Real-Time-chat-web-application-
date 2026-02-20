import React from 'react';
import { useVideoCall } from '../../context/VideoCallContext';
import { PhoneIcon, PhoneXMarkIcon, VideoCameraIcon } from '@heroicons/react/24/solid';

const IncomingCallOverlay = () => {
    const {
        incomingCall,
        answerCall,
        declineCall
    } = useVideoCall();

    if (!incomingCall) {
        return null;
    }

    const caller = incomingCall.caller;

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-auto transform transition-all duration-300 scale-100">
                {/* Header */}
                <div className="text-center pt-8 pb-6">
                    <p className="text-gray-600 text-sm mb-2">Incoming video call</p>
                    <div className="flex items-center justify-center mb-4">
                        <VideoCameraIcon className="w-5 h-5 text-blue-500 mr-2" />
                        <span className="text-blue-500 font-medium">Video Call</span>
                    </div>
                </div>

                {/* Caller Info */}
                <div className="text-center pb-8">
                    {/* Profile Picture with Animation */}
                    <div className="relative mb-4 mx-auto w-32 h-32">
                        <div className="absolute inset-0 rounded-full bg-linear-to-br from-blue-500 to-purple-600 animate-pulse"></div>
                        <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white shadow-xl">
                            {caller?.profilePic ? (
                                <img 
                                    src={caller.profilePic} 
                                    alt={caller.fullName}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-4xl font-bold text-white">
                                    {caller?.fullName?.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        {/* Pulsing Ring Animation */}
                        <div className="absolute inset-0 rounded-full border-4 border-blue-500 animate-ping opacity-20"></div>
                        <div className="absolute -inset-2 rounded-full border-2 border-blue-400 animate-ping opacity-10" style={{animationDelay: '0.5s'}}></div>
                    </div>

                    {/* Caller Name */}
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                        {caller?.fullName || 'Unknown Caller'}
                    </h2>
                    
                    {/* Caller Email */}
                    <p className="text-gray-500 text-sm mb-6">
                        {caller?.email}
                    </p>

                    {/* Calling Animation */}
                    <div className="flex justify-center items-center space-x-1 mb-8">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        <span className="ml-3 text-blue-600 font-medium">Incoming call...</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-center space-x-8 pb-8">
                    {/* Decline Button */}
                    <button
                        onClick={declineCall}
                        className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg transform hover:scale-105 active:scale-95"
                        title="Decline Call"
                    >
                        <PhoneXMarkIcon className="w-7 h-7 text-white" />
                    </button>

                    {/* Accept Button */}
                    <button
                        onClick={answerCall}
                        className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg transform hover:scale-105 active:scale-95 animate-pulse"
                        title="Accept Call"
                    >
                        <PhoneIcon className="w-7 h-7 text-white" />
                    </button>
                </div>

                {/* Quick Actions (Optional) */}
                <div className="border-t border-gray-100 px-6 py-4">
                    <div className="flex justify-center space-x-4 text-xs text-gray-500">
                        <span>Swipe up to accept</span>
                        <span>•</span>
                        <span>Swipe down to decline</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IncomingCallOverlay;