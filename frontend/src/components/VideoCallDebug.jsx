import React, { useState } from 'react';
import { useVideoCall } from '../../context/VideoCallContext';
import toast from 'react-hot-toast';

const VideoCallDebug = () => {
    const { checkMediaDevices } = useVideoCall();
    const [debugInfo, setDebugInfo] = useState(null);
    const [isChecking, setIsChecking] = useState(false);

    const testMediaAccess = async () => {
        setIsChecking(true);
        try {
            console.log('🔍 Starting media access test...');
            
            // Test device enumeration
            const deviceInfo = await checkMediaDevices();
            console.log('📱 Device info:', deviceInfo);
            
            // Test actual media access
            console.log('🎥 Testing media access...');
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                
                console.log('✅ Full media access successful');
                const videoTracks = stream.getVideoTracks();
                const audioTracks = stream.getAudioTracks();
                
                const accessInfo = {
                    success: true,
                    videoTracks: videoTracks.length,
                    audioTracks: audioTracks.length,
                    videoEnabled: videoTracks.length > 0 && videoTracks[0].enabled,
                    audioEnabled: audioTracks.length > 0 && audioTracks[0].enabled,
                    videoSettings: videoTracks[0]?.getSettings(),
                    audioSettings: audioTracks[0]?.getSettings(),
                    devices: deviceInfo
                };
                
                setDebugInfo(accessInfo);
                toast.success('✅ Media access working correctly!');
                
                // Clean up
                stream.getTracks().forEach(track => track.stop());
                
            } catch (mediaError) {
                console.error('❌ Media access failed:', mediaError);
                
                const errorInfo = {
                    success: false,
                    error: mediaError.name,
                    message: mediaError.message,
                    devices: deviceInfo
                };
                
                setDebugInfo(errorInfo);
                toast.error(`❌ Media access failed: ${mediaError.name}`);
            }
            
        } catch (error) {
            console.error('❌ Device check failed:', error);
            setDebugInfo({
                success: false,
                error: 'DEVICE_CHECK_FAILED',
                message: error.message
            });
            toast.error('❌ Device check failed');
        } finally {
            setIsChecking(false);
        }
    };

    const getAdvice = () => {
        if (!debugInfo) return null;
        
        if (debugInfo.success) {
            return (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mt-4">
                    <h4 className="text-green-400 font-semibold mb-2">✅ Media Access Working</h4>
                    <ul className="text-green-300 text-sm space-y-1">
                        <li>Video tracks: {debugInfo.videoTracks}</li>
                        <li>Audio tracks: {debugInfo.audioTracks}</li>
                        <li>Video enabled: {debugInfo.videoEnabled ? '✅' : '❌'}</li>
                        <li>Audio enabled: {debugInfo.audioEnabled ? '✅' : '❌'}</li>
                    </ul>
                    {!debugInfo.videoEnabled || !debugInfo.audioEnabled ? (
                        <p className="text-yellow-400 text-sm mt-2">
                            ⚠️ Some tracks are disabled. Check device settings.
                        </p>
                    ) : null}
                </div>
            );
        }
        
        const { error, message } = debugInfo;
        let advice = [];
        
        switch (error) {
            case 'NotAllowedError':
                advice = [
                    'Click "Allow" when browser asks for camera/microphone permission',
                    'Check browser settings and remove any blocks for this site',
                    'If in incognito mode, try normal browsing mode'
                ];
                break;
            case 'NotFoundError':
                advice = [
                    'Make sure camera and microphone are connected',
                    'Check if other apps are using your camera/microphone',
                    'Restart your browser and try again'
                ];
                break;
            case 'NotReadableError':
                advice = [
                    'Close other apps that might be using camera/microphone',
                    'Restart your browser',
                    'Check device drivers are updated'
                ];
                break;
            case 'SecurityError':
                advice = [
                    'Use HTTPS or localhost (not network IP)',
                    'If on network, ask friends to use localhost instead',
                    'Check if you\'re in a secure browsing context'
                ];
                break;
            default:
                advice = [
                    'Try refreshing the page',
                    'Use a different browser (Chrome, Firefox, Safari)',
                    'Check console for more details'
                ];
        }
        
        return (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mt-4">
                <h4 className="text-red-400 font-semibold mb-2">❌ {error}</h4>
                <p className="text-red-300 text-sm mb-3">{message}</p>
                <h5 className="text-red-400 font-medium mb-2">Solutions:</h5>
                <ul className="text-red-300 text-sm space-y-1">
                    {advice.map((item, i) => (
                        <li key={i}>• {item}</li>
                    ))}
                </ul>
            </div>
        );
    };

    return (
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
            <h3 className="text-white font-semibold mb-3">🛠️ Video Call Diagnostic</h3>
            
            <button
                onClick={testMediaAccess}
                disabled={isChecking}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 px-4 py-2 rounded-lg text-white font-medium transition-colors"
            >
                {isChecking ? '🔍 Checking...' : '🎥 Test Camera & Mic'}
            </button>
            
            {debugInfo && getAdvice()}
            
            <div className="mt-4 text-gray-400 text-xs">
                <p>💡 Tips for video calls:</p>
                <ul className="mt-1 space-y-1">
                    <li>• Both users need camera/microphone permissions</li>
                    <li>• Use localhost (not network IP) for best compatibility</li>
                    <li>• If one person is in incognito mode, try normal browsing</li>
                    <li>• Make sure no other app is using your camera/mic</li>
                </ul>
            </div>
        </div>
    );
};

export default VideoCallDebug;