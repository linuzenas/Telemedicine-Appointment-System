import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { useStore } from '../store/useStore';

const VideoCall = () => {
    const { roomName } = useParams();
    const navigate = useNavigate();
    const { user } = useStore();
    const [isApiReady, setIsApiReady] = useState(false);

    const handleReadyToClose = () => {
        // Return to the dashboard based on user role when call is hung up
        if (user?.role === 'doctor') {
            navigate('/doctor');
        } else {
            navigate('/patient');
        }
    };

    return (
        <div style={{ height: '80vh', width: '100%' }}>
            <div className="bg-gray-800 text-white p-2 text-center rounded-t-lg shadow-sm">
                <p className="font-semibold text-sm">Telemedicine Secure Consultation Line</p>
                {!isApiReady && <span className="text-xs text-gray-400">Loading Secure Room...</span>}
            </div>
            <JitsiMeeting
                domain="meet.jit.si"
                roomName={roomName}
                configOverwrite={{
                    startWithAudioMuted: false,
                    startWithVideoMuted: false,
                }}
                interfaceConfigOverwrite={{
                    DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                }}
                userInfo={{
                    displayName: user?.name,
                    email: user?.email
                }}
                onApiReady={(externalApi) => {
                    setIsApiReady(true);
                }}
                onReadyToClose={handleReadyToClose}
                getIFrameRef={(iframeRef) => {
                    iframeRef.style.height = '100%';
                    iframeRef.style.width = '100%';
                    iframeRef.style.border = '0px';
                }}
            />
        </div>
    );
};

export default VideoCall;
