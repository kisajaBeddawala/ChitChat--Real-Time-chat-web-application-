import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { AuthContext } from "./AuthContext";
import Peer from "peerjs";
import toast from "react-hot-toast";

export const VideoCallContext = createContext();

export const VideoCallProvider = ({ children }) => {
    const { socket, authUser } = useContext(AuthContext);
    
    // Call states
    const [isCallActive, setIsCallActive] = useState(false);
    const [incomingCall, setIncomingCall] = useState(null);
    const [isOutgoingCall, setIsOutgoingCall] = useState(false);
    const [callPartner, setCallPartner] = useState(null);
    
    // Media states
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    
    // Refs
    const peerRef = useRef(null);
    const callRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    // Initialize PeerJS  
    useEffect(() => {
        if (authUser && !peerRef.current) {
            // Enhanced configuration for better cross-network connectivity
            const peerConfig = {
                config: {
                    'iceServers': [
                        // Multiple Google STUN servers
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' },
                        { urls: 'stun:stun2.l.google.com:19302' },
                        { urls: 'stun:stun3.l.google.com:19302' },
                        { urls: 'stun:stun4.l.google.com:19302' },
                        // Cloudflare STUN servers
                        { urls: 'stun:stun.cloudflare.com:3478' },
                        // Twilio STUN servers
                        { urls: 'stun:global.stun.twilio.com:3478' },
                        // Free TURN servers for NAT traversal (crucial for ngrok)
                        {
                            urls: 'turn:relay1.expressturn.com:3478',
                            username: 'efAVT1HZLXYP3KNHKN',
                            credential: 'W3O8U7SHDFW3NQGUVMVN'
                        },
                        {
                            urls: 'turns:relay1.expressturn.com:5349',
                            username: 'efAVT1HZLXYP3KNHKN',
                            credential: 'W3O8U7SHDFW3NQGUVMVN'
                        },
                        // Additional TURN servers
                        {
                            urls: 'turn:openrelay.metered.ca:80',
                            username: 'openrelayproject',
                            credential: 'openrelayproject'
                        },
                        {
                            urls: 'turn:openrelay.metered.ca:443',
                            username: 'openrelayproject', 
                            credential: 'openrelayproject'
                        },
                        {
                            urls: 'turns:openrelay.metered.ca:443',
                            username: 'openrelayproject',
                            credential: 'openrelayproject'
                        }
                    ],
                    'iceCandidatePoolSize': 20, // Increased for better connectivity
                    'bundlePolicy': 'max-bundle',
                    'rtcpMuxPolicy': 'require',
                    'iceTransportPolicy': 'all' // Allow both STUN and TURN
                },
                debug: process.env.NODE_ENV === 'development' ? 2 : 0
            };

            // Use user ID as peer ID for consistency (no timestamp)
            console.log('🔄 Creating peer with user ID:', authUser._id);
            
            const peer = new Peer(authUser._id, peerConfig);

            peer.on('open', (id) => {
                console.log('✅ Peer connected with ID:', id);
                // Verify the peer ID matches our user ID
                if (id === authUser._id) {
                    console.log('✅ Peer ID matches user ID - ready for calls');
                    toast.success('Video call service ready');
                } else {
                    console.warn('⚠️ Peer ID mismatch:', id, 'vs', authUser._id);
                    toast.warning('Video call service connected but with different ID');
                }
            });

            peer.on('call', (call) => {
                console.log('📞 Incoming PeerJS call from:', call.peer);
                // Store the call reference for answering later
                callRef.current = call;
                
                // If we already have an incoming call notification for this peer, we're ready
                if (incomingCall && incomingCall.from === call.peer) {
                    console.log('✅ Call reference stored for existing incoming call');
                } else {
                    console.log('📞 Call reference stored, waiting for socket notification');
                }
            });

            peer.on('error', (error) => {
                console.error('PeerJS Error:', error);
                
                // Handle different error types with better messages
                if (error.type === 'network') {
                    toast.error('Network connection failed. Please check your internet connection.');
                } else if (error.type === 'peer-unavailable') {
                    toast.error('The person is not available for video calls. They may need to refresh their page.');
                } else if (error.type === 'server-error') {
                    toast.error('Video call service is temporarily unavailable.');
                } else if (error.type === 'socket-error') {
                    toast.error('Connection to video call service failed. Please try again.');
                } else if (error.message && error.message.includes('Could not connect to peer')) {
                    console.log('🔄 Peer connection failed, this is normal for cross-network calls');
                    // Don't show error toast for peer connection failures - they're handled by TURN servers
                } else {
                    toast.error('Video call connection error. Please try again.');
                }
            });

            peer.on('disconnected', () => {
                console.log('Peer disconnected, attempting to reconnect...');
                // Attempt to reconnect
                if (!peer.destroyed) {
                    peer.reconnect();
                }
            });

            peerRef.current = peer;
        }

        return () => {
            if (peerRef.current) {
                peerRef.current.destroy();
                peerRef.current = null;
            }
        };
    }, [authUser]);

    // Get user media with error handling
    const getUserMedia = useCallback(async (retryOptions = {}) => {
        try {
            // Enhanced secure context detection for development and production
            const hostname = location.hostname;
            const protocol = location.protocol;
            const port = location.port;
            
            // Check if we're in a secure context
            const isHTTPS = protocol === 'https:';
            const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
            const isLocalIP = /^192\.168\./.test(hostname) || 
                            /^10\./.test(hostname) || 
                            /^172\.(1[6-9]|2\d|3[01])\./.test(hostname);
            const isDevPort = ['3000', '3001', '5173', '5174', '8080', '8000', '4000'].includes(port);
            
            // More permissive for development - allow local networks
            const isDevelopment = process.env.NODE_ENV === 'development' || 
                                hostname.includes('localhost') || 
                                isLocalIP || 
                                isDevPort;

            // Browser's actual secure context (what getUserMedia checks)
            const isBrowserSecureContext = window.isSecureContext || isHTTPS || isLocalhost;
            
            // Our app's secure context (more permissive for local development)
            const isAppSecureContext = isBrowserSecureContext || (isDevelopment && isLocalIP);

            // Check if we're in incognito mode (best effort detection)
            const isIncognitoMode = await new Promise((resolve) => {
                // Try different methods to detect incognito mode
                if ('storage' in navigator && 'estimate' in navigator.storage) {
                    navigator.storage.estimate().then((estimate) => {
                        // In incognito mode, storage quota is very low
                        resolve(estimate.quota < 120000000); // Less than 120MB suggests incognito
                    }).catch(() => resolve(false));
                } else {
                    resolve(false);
                }
            });

            if (isIncognitoMode) {
                console.warn('⚠️ Incognito/Private browsing detected. Video calls may have limitations.');
                toast('🕵️ Private browsing detected. If video doesn\'t work, try normal mode.', {
                    duration: 4000,
                    icon: '💡'
                });
            }

            if (!isAppSecureContext) {
                // Provide specific guidance for network access issues
                let errorMessage = 'Video calls require HTTPS or localhost access.';
                
                if (isLocalIP) {
                    errorMessage = `Network access detected (${hostname}). For video calls over local network, please use one of these solutions:

📱 RECOMMENDED FOR FRIENDS:
• Use localhost on their own machine: http://localhost${port ? ':' + port : ''}
• Or use HTTPS: https://${hostname}${port ? ':' + port : ''}

🛠️ DEVELOPMENT OPTIONS:
• Set up local HTTPS certificates
• Use tunneling (ngrok, etc.) to create HTTPS URLs
• Access via localhost and share screen instead

Why this happens: Browsers require HTTPS for camera/microphone access on network addresses for security.`;
                } else if (isDevelopment || isDevPort) {
                    errorMessage += ` Please try: http://localhost${port ? ':' + port : ''}`;
                } else {
                    errorMessage += ' Please access the app via HTTPS.';
                }
                
                throw new Error(errorMessage);
            }

            // Additional check: If we're on local network but browser still says not secure
            if (isLocalIP && !isBrowserSecureContext) {
                console.warn('⚠️ Local network detected but browser security context is false. Video calls may fail.');
                console.warn('💡 Solution: Have friends use localhost instead of network IP for video calls.');
            }

            // Debug browser capabilities (only in development)
            if (process.env.NODE_ENV === 'development') {
                console.log('=== Video Call Debug Info ===');
                console.log('Browser:', navigator.userAgent.substring(0, 50) + '...');
                console.log('Protocol:', protocol);
                console.log('Host:', `${hostname}${port ? ':' + port : ''}`);
                console.log('Secure Context (Browser):', window.isSecureContext);
                console.log('MediaDevices Available:', !!navigator.mediaDevices);
                console.log('Incognito Mode detected:', isIncognitoMode);
                console.log('===============================');
            }

            // Check if we're in Chrome mobile emulation mode
            const isDeviceEmulation = navigator.userAgent.includes('Mobile') && 
                                    navigator.userAgent.includes('Chrome') &&
                                    !('ontouchstart' in window); // Real mobile devices have touch
            
            if (isDeviceEmulation) {
                console.log('🚧 Chrome mobile device emulation detected');
                throw new Error('MOBILE_EMULATION: Video calls are not supported in Chrome\'s mobile device emulation mode. Please turn off device emulation (click the 📱 icon in DevTools) and try again.');
            }

            // Enhanced media constraints with fallbacks
            const constraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    ...retryOptions.audio
                },
                video: {
                    width: { min: 320, ideal: 1280, max: 1920 },
                    height: { min: 240, ideal: 720, max: 1080 },
                    frameRate: { min: 15, ideal: 30, max: 30 },
                    facingMode: 'user',
                    ...retryOptions.video
                }
            };

            // Try modern approach first - but with more lenient checking
            if (navigator.mediaDevices) {
                try {
                    // First check if getUserMedia exists
                    if (typeof navigator.mediaDevices.getUserMedia === 'function') {
                        console.log('✅ Modern getUserMedia detected');
                        const stream = await navigator.mediaDevices.getUserMedia(constraints);
                        console.log('✅ Media stream acquired successfully');
                        
                        // Test if we actually got video and audio
                        const videoTracks = stream.getVideoTracks();
                        const audioTracks = stream.getAudioTracks();
                        
                        console.log(`📹 Video tracks: ${videoTracks.length}, 🎤 Audio tracks: ${audioTracks.length}`);
                        
                        if (videoTracks.length === 0 && audioTracks.length === 0) {
                            throw new Error('No video or audio tracks obtained from media stream');
                        }
                        
                        // Log track states for debugging
                        videoTracks.forEach((track, i) => {
                            console.log(`Video track ${i}:`, {
                                enabled: track.enabled,
                                readyState: track.readyState,
                                label: track.label
                            });
                        });
                        
                        audioTracks.forEach((track, i) => {
                            console.log(`Audio track ${i}:`, {
                                enabled: track.enabled,
                                readyState: track.readyState,
                                label: track.label
                            });
                        });
                        
                        return stream;
                    } else {
                        console.log('❌ navigator.mediaDevices.getUserMedia is not a function');
                    }
                } catch (mediaError) {
                    console.log('❌ Modern getUserMedia failed:', mediaError);
                    
                    // Try with fallback constraints if the error indicates constraint issues
                    if (mediaError.name === 'OverconstrainedError' || 
                        mediaError.name === 'ConstraintNotSatisfiedError') {
                        
                        console.log('🔄 Retrying with basic constraints...');
                        try {
                            const basicConstraints = {
                                audio: true,
                                video: { 
                                    width: { min: 320, ideal: 640 },
                                    height: { min: 240, ideal: 480 }
                                }
                            };
                            const stream = await navigator.mediaDevices.getUserMedia(basicConstraints);
                            console.log('✅ Media stream acquired with basic constraints');
                            return stream;
                        } catch (retryError) {
                            console.log('❌ Retry with basic constraints failed:', retryError);
                            throw retryError;
                        }
                    }
                    
                    // Re-throw media access errors (permissions, devices, etc.)
                    throw mediaError;
                }
            } else {
                console.log('❌ navigator.mediaDevices not available');
            }

            // Fallback for older browsers or special cases
            const legacyGetUserMedia = navigator.getUserMedia || 
                                     navigator.webkitGetUserMedia || 
                                     navigator.mozGetUserMedia || 
                                     navigator.msGetUserMedia;

            if (legacyGetUserMedia && typeof legacyGetUserMedia === 'function') {
                console.log('✅ Legacy getUserMedia detected');
                try {
                    // Convert callback-based API to Promise
                    return new Promise((resolve, reject) => {
                        legacyGetUserMedia.call(navigator, {
                            video: true,
                            audio: true
                        }, resolve, reject);
                    });
                } catch (mediaError) {
                    console.log('❌ Legacy getUserMedia failed:', mediaError);
                    // Re-throw media access errors
                    throw mediaError;
                }
            } else {
                console.log('❌ No legacy getUserMedia methods found');
            }

            // If we reach here, truly no support
            console.log('❌ No getUserMedia support detected at all');
            throw new Error('BROWSER_NOT_SUPPORTED: Your browser does not support video calls. Please update your browser or use Chrome, Firefox, or Safari.');

        } catch (error) {
            console.error('Error accessing media devices:', error);
            
            if (error.message && error.message.includes('MOBILE_EMULATION')) {
                toast.error('Please turn off Chrome\'s mobile device emulation mode (📱 icon in DevTools) to use video calls.');
            } else if (error.message && error.message.includes('requires HTTPS')) {
                // Check if this is a network access issue
                const isNetworkIssue = error.message.includes('Network access detected');
                
                if (isNetworkIssue) {
                    toast.error('Video calls over network require HTTPS or localhost. Tell your friend to use localhost instead!');
                    console.log('🎥 Video Call Network Issue Solutions:');
                    console.log('👥 For friends: Use http://localhost:5173 instead of network IP');
                    console.log('🔒 For production: Set up HTTPS certificates');
                    console.log('🚇 For sharing: Use ngrok or similar tunneling service');
                } else {
                    // Extract guidance from error message for better user experience
                    const fullMessage = error.message;
                    if (fullMessage.includes('Please try:')) {
                        // Development context - show specific URLs
                        toast.error('For video calls, please access via localhost. Check console for details.');
                        console.log('Video Call Access Guide:', fullMessage);
                    } else {
                        // Production context
                        toast.error('Video calls require HTTPS. Please access the app via https://');
                    }
                }
            } else if (error.message && error.message.includes('BROWSER_NOT_SUPPORTED')) {
                toast.error('Your browser does not support video calls. Please update your browser or use Chrome, Firefox, or Safari.');
            } else if (error.name === 'NotAllowedError') {
                toast.error('Camera and microphone access denied. Please click "Allow" when prompted and try again.');
            } else if (error.name === 'NotFoundError') {
                toast.error('No camera or microphone found. Please connect your devices and try again.');
            } else if (error.name === 'NotReadableError') {
                toast.error('Camera or microphone is being used by another application. Please close other apps and try again.');
            } else if (error.name === 'OverconstrainedError') {
                toast.error('Camera or microphone settings are not supported. Please check your device settings.');
            } else if (error.name === 'AbortError') {
                toast.error('Media access was aborted. Please try again.');
            } else if (error.name === 'SecurityError') {
                toast.error('Security error accessing camera/microphone. Please ensure you\'re using HTTPS or localhost.');
            } else {
                toast.error(`Failed to access camera and microphone: ${error.message || 'Unknown error'}. Please refresh the page and try again.`);
            }
            
            throw error;
        }
    }, []);

    // End call
    const endCall = useCallback(() => {
        // Clean up streams
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }
        
        if (remoteStream) {
            remoteStream.getTracks().forEach(track => track.stop());
            setRemoteStream(null);
        }

        // Clean up peer connection
        if (callRef.current) {
            callRef.current.close();
            callRef.current = null;
        }

        // Notify other peer if there's a partner
        if (callPartner && socket) {
            socket.emit('call-ended', {
                to: callPartner._id
            });
        }

        // Reset states
        setIsCallActive(false);
        setIsOutgoingCall(false);
        setCallPartner(null);
        setIncomingCall(null);
        setIsMuted(false);
        setIsCameraOff(false);
    }, [localStream, remoteStream, callPartner, socket]);

    // Check media device availability and permissions
    const checkMediaDevices = useCallback(async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                return { video: false, audio: false, error: 'MediaDevices API not available' };
            }
            
            // Check for available devices
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            const audioDevices = devices.filter(device => device.kind === 'audioinput');
            
            console.log('📱 Media devices detected:', {
                video: videoDevices.length,
                audio: audioDevices.length
            });
            
            // Check permissions if available
            let permissions = { video: 'unknown', audio: 'unknown' };
            if (navigator.permissions && navigator.permissions.query) {
                try {
                    const videoPermission = await navigator.permissions.query({ name: 'camera' });
                    const audioPermission = await navigator.permissions.query({ name: 'microphone' });
                    permissions = {
                        video: videoPermission.state,
                        audio: audioPermission.state
                    };
                } catch (permError) {
                    console.log('Permission query not supported:', permError);
                }
            }
            
            return {
                video: videoDevices.length > 0,
                audio: audioDevices.length > 0,
                permissions,
                devices: { video: videoDevices.length, audio: audioDevices.length }
            };
        } catch (error) {
            console.error('Error checking media devices:', error);
            return { video: false, audio: false, error: error.message };
        }
    }, []);
    
    // Update video elements when streams change
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);
    
    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);
    useEffect(() => {
        if (!socket) return;

        const handleIncomingCall = (data) => {
            console.log('🔔 Incoming call notification from:', data.from);
            setIncomingCall(data);
        };

        const handleCallAnswered = () => {
            console.log('📞 Remote user answered the call');
            // Just update UI state - the PeerJS call flow will handle the streams
            setIsCallActive(true);
            setIsOutgoingCall(false);
            toast.success('Call connected!');
        };

        const handleCallDeclined = () => {
            toast.error('Call was declined');
            endCall();
        };

        const handleCallEnded = () => {
            endCall();
        };

        socket.on('incoming-call', handleIncomingCall);
        socket.on('call-answered', handleCallAnswered);
        socket.on('call-declined', handleCallDeclined);
        socket.on('call-ended', handleCallEnded);

        return () => {
            socket.off('incoming-call', handleIncomingCall);
            socket.off('call-answered', handleCallAnswered);
            socket.off('call-declined', handleCallDeclined);
            socket.off('call-ended', handleCallEnded);
        };
    }, [socket, getUserMedia, endCall]);

    // Start a call
    const startCall = async (userId, userInfo) => {
        try {
            console.log('🔄 Starting call to user ID:', userId);

            const stream = await getUserMedia();
            setLocalStream(stream);
            setCallPartner(userInfo);
            setIsOutgoingCall(true);

            // Send call signal through socket
            socket.emit('call-user', {
                to: userId,
                caller: authUser
            });

            console.log('📨 Call signal sent to:', userId);
            
            // Make PeerJS call using their user ID
            console.log('📞 Making PeerJS call to:', userId);
            const call = peerRef.current.call(userId, stream);
            callRef.current = call;

            // Monitor connection state
            call.on('stream', (remoteStream) => {
                console.log('✅ Remote stream received from:', userId);
                setRemoteStream(remoteStream);
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = remoteStream;
                }
                setIsCallActive(true);
                setIsOutgoingCall(false);
                toast.success('Call connected!');
            });

            // Add connection monitoring
            call.on('close', () => {
                console.log('📞 Call closed');
                endCall();
            });

            call.on('error', (error) => {
                console.error('❌ Call error:', error);
                
                // Try alternative connection methods
                if (error.message && error.message.includes('Could not connect to peer')) {
                    console.log('🔄 Direct peer connection failed, waiting for TURN server relay...');
                    toast.info('Establishing connection... This may take a moment.');
                } else {
                    toast.error('Call connection failed. Please try again.');
                    endCall();
                }
            });

            // Add longer timeout for TURN server connections
            setTimeout(() => {
                if (callRef.current === call && !remoteStream && isOutgoingCall) {
                    console.warn('⏰ Call connection timeout after 45 seconds');
                    toast.error('Unable to establish video connection. This may be due to network restrictions.');
                    endCall();
                }
            }, 45000); // 45 second timeout for cross-network calls

        } catch (error) {
            console.error('Error starting call:', error);
            toast.error('Failed to start call: ' + error.message);
            setIsOutgoingCall(false);
            setCallPartner(null);
        }
    };

    // Answer incoming call
    const answerCall = async () => {
        if (!incomingCall) {
            console.error('❌ No incoming call to answer');
            toast.error('No incoming call found');
            return;
        }

        // Wait for PeerJS call reference (handle timing issue)
        let attempts = 0;
        const maxAttempts = 15; // Wait up to 3 seconds (15 * 200ms)
        
        while (!callRef.current && attempts < maxAttempts) {
            console.log(`⏳ Waiting for PeerJS call reference... (${attempts + 1}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, 200)); // Wait 200ms
            attempts++;
        }

        if (!callRef.current) {
            console.error('❌ PeerJS call reference not available after waiting');
            console.log('🔍 Debug: incomingCall.from =', incomingCall.from);
            console.log('🔍 Debug: authUser._id =', authUser._id);
            toast.error('Call connection failed. Please try again.');
            declineCall();
            return;
        }

        try {
            console.log('🔄 Answering call from:', incomingCall?.from);
            const stream = await getUserMedia();
            setLocalStream(stream);
            setCallPartner(incomingCall.caller);
            
            // Answer the peer call - this should only be called once
            console.log('📞 Answering PeerJS call with stream...');
            callRef.current.answer(stream);
            
            // Set up stream handler for when we receive remote video
            callRef.current.on('stream', (remoteStream) => {
                console.log('✅ Remote stream received in answer');
                setRemoteStream(remoteStream);
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = remoteStream;
                }
                toast.success('Call connected!');
            });

            // Add connection monitoring
            callRef.current.on('close', () => {
                console.log('📞 Answered call closed');
                endCall();
            });

            callRef.current.on('error', (error) => {
                console.error('❌ Answered call error:', error);
                if (error.message && error.message.includes('Could not connect to peer')) {
                    console.log('🔄 Peer connection issue, waiting for TURN server...');
                    toast.info('Establishing connection... Please wait.');
                } else {
                    toast.error('Call connection failed. Please try again.');
                    endCall();
                }
            });

            // Notify caller through socket (this triggers their handleCallAnswered)
            socket.emit('answer-call', {
                to: incomingCall.from
            });

            console.log('📨 Answer signal sent to:', incomingCall.from);
            setIsCallActive(true);
            setIncomingCall(null);

        } catch (error) {
            console.error('Error answering call:', error);
            toast.error('Failed to answer call: ' + error.message);
            declineCall();
        }
    };

    // Decline incoming call
    const declineCall = () => {
        if (incomingCall) {
            socket.emit('call-declined', {
                to: incomingCall.from
            });
        }
        setIncomingCall(null);
    };

    // Toggle mute
    const toggleMute = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    // Toggle camera
    const toggleCamera = () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsCameraOff(!videoTrack.enabled);
            }
        }
    };

    const value = {
        // States
        isCallActive,
        incomingCall,
        isOutgoingCall,
        callPartner,
        localStream,
        remoteStream,
        isMuted,
        isCameraOff,
        // Refs
        localVideoRef,
        remoteVideoRef,
        // Methods
        startCall,
        answerCall,
        declineCall,
        endCall,
        toggleMute,
        toggleCamera,
        checkMediaDevices
    };

    return (
        <VideoCallContext.Provider value={value}>
            {children}
        </VideoCallContext.Provider>
    );
};

// Custom hook
export const useVideoCall = () => {
    const context = useContext(VideoCallContext);
    if (!context) {
        throw new Error('useVideoCall must be used within VideoCallProvider');
    }
    return context;
};