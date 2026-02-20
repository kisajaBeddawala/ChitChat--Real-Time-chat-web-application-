import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext.jsx';
import { ChatProvider } from '../context/ChatContext.jsx';
import { GroupProvider } from '../context/GroupContext.jsx';
import { VideoCallProvider } from '../context/VideoCallContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <ChatProvider>
          <GroupProvider>
            <VideoCallProvider>
              <App />
            </VideoCallProvider>
          </GroupProvider>
        </ChatProvider>
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>
)
