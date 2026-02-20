import React from 'react';
import { useVideoCall } from '../../context/VideoCallContext';
import { 
    PhoneXMarkIcon, 
    MicrophoneIcon, 
    VideoCameraIcon,
    XMarkIcon 
} from '@heroicons/react/24/solid';
import { 
    MicrophoneIcon as MicrophoneOutlineIcon, 
    VideoCameraIcon as VideoCameraOutlineIcon 
} from '@heroicons/react/24/outline';

const VideoCall = () => {
    const {
        isCallActive,
        isOutgoingCall,
        callPartner,
        localStream,
        remoteStream,
        isMuted,
        isCameraOff,
        localVideoRef,
        remoteVideoRef,
        endCall,
        toggleMute,
        toggleCamera
    } = useVideoCall();

    // Don't render if no call is active
    if (!isCallActive && !isOutgoingCall) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            {/* Remote Video (Full Screen) */}
            <div className="flex-1 relative overflow-hidden">
                {remoteStream ? (
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                        <div className="text-center text-white">
                            {isOutgoingCall ? (
                                <>
                                    <div className="w-32 h-32 rounded-full bg-gray-700 mx-auto mb-4 flex items-center justify-center overflow-hidden">
                                        {callPartner?.profilePic ? (
                                            <img 
                                                src={callPartner.profilePic} 
                                                alt={callPartner.fullName}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-4xl font-bold text-white">
                                                {callPartner?.fullName?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <h2 className="text-2xl font-semibold mb-2">
                                        {callPartner?.fullName}
                                    </h2>
                                    <p className="text-gray-300 mb-4">Calling...</p>
                                    <div className="flex justify-center">
                                        <div className="animate-pulse flex space-x-1">
                                            <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="w-32 h-32 rounded-full bg-gray-700 mx-auto mb-4 flex items-center justify-center overflow-hidden">
                                        {callPartner?.profilePic ? (
                                            <img 
                                                src={callPartner.profilePic} 
                                                alt={callPartner.fullName}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-4xl font-bold text-white">
                                                {callPartner?.fullName?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <h2 className="text-2xl font-semibold mb-2">
                                        {callPartner?.fullName}
                                    </h2>
                                    <p className="text-gray-300">Connecting...</p>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Local Video (Picture-in-Picture) */}
                <div className="absolute top-6 right-6 w-40 h-28 bg-gray-800 rounded-lg overflow-hidden shadow-2xl border-2 border-white/20">
                    {localStream && !isCameraOff ? (
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover scale-x-[-1]" // Mirror effect for local video
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                            <VideoCameraOutlineIcon className="w-8 h-8 text-gray-400 opacity-50" />
                        </div>
                    )}
                </div>

                {/* Top Bar - Partner Info */}
                {isCallActive && (
                    <div className="absolute top-6 left-6 flex items-center space-x-3 bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2">
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                            {callPartner?.profilePic ? (
                                <img 
                                    src={callPartner.profilePic} 
                                    alt={callPartner.fullName}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
                                    {callPartner?.fullName?.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div>
                            <h3 className="text-white font-medium text-sm">
                                {callPartner?.fullName}
                            </h3>
                            <div className="text-green-400 text-xs flex items-center">
                                <span className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse inline-block"></span>
                                Connected
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Control Bar */}
            <div className="bg-black/80 backdrop-blur-sm border-t border-white/10 px-6 py-4">
                <div className="flex items-center justify-center space-x-6">
                    {/* Mute Button */}
                    <button
                        onClick={toggleMute}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
                            isMuted 
                                ? 'bg-red-500 hover:bg-red-600' 
                                : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                        title={isMuted ? "Unmute" : "Mute"}
                    >
                        {isMuted ? (
                            <MicrophoneOutlineIcon className="w-6 h-6 text-white opacity-50" />
                        ) : (
                            <MicrophoneIcon className="w-6 h-6 text-white" />
                        )}
                    </button>

                    {/* End Call Button */}
                    <button
                        onClick={endCall}
                        className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg"
                        title="End Call"
                    >
                        <PhoneXMarkIcon className="w-7 h-7 text-white" />
                    </button>

                    {/* Camera Button */}
                    <button
                        onClick={toggleCamera}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
                            isCameraOff 
                                ? 'bg-red-500 hover:bg-red-600' 
                                : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                        title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
                    >
                        {isCameraOff ? (
                            <VideoCameraOutlineIcon className="w-6 h-6 text-white opacity-50" />
                        ) : (
                            <VideoCameraIcon className="w-6 h-6 text-white" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VideoCall;