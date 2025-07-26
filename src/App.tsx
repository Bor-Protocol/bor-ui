import { LiveStream } from './components/LiveStream';
import { SimpleLandingPage } from './components/SimpleLandingPage';
import { PrivateSession } from './components/PrivateSession';

import { SceneProvider } from './contexts/ScenesContext';
import { AuthProvider } from './contexts/AuthContext';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DocsPage } from './components/DocsPage';


import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import SceneConfigurator from './components/SceneConfigurator';
import { StreamConfigEditor } from './components/StreamConfigEditor';
import { AgentIntegrationDemo } from './components/AgentIntegrationDemo';
import { AuthTestPage } from './pages/AuthTestPage';
import { StreamSelector } from './components/StreamSelector';

const queryClient = new QueryClient();

import { SceneEngineProvider } from './contexts/SceneEngineContext';
import { useInvisibleRecording } from './hooks/useInvisibleRecording';

export default function App() {

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <SceneProvider>
            <SceneEngineProvider>
              <Routes>
                <Route path="/agent/:agentId/public" element={<InnerApp />} />
                <Route path="/agent/:agentId/private" element={<InnerApp />} />
                <Route path="/private-session/:agentId" element={<PrivateSession />} />
                <Route path="/:modelName" element={<InnerApp />} />
                <Route path="/app" element={<InnerApp />} />
                <Route path="/configure" element={<StreamConfigEditor />} />
                <Route path="/docs" element={<DocsPage />} />
                <Route path="/demo" element={<AgentIntegrationDemo />} />
                <Route path="/auth-test" element={<AuthTestPage />} />
                <Route path="/streams" element={<StreamSelector />} />
                <Route path="/" element={<SimpleLandingPage />} />
              </Routes>      
            </SceneEngineProvider>
          </SceneProvider>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}


const InnerApp = () => {
  // Initialize invisible recording only once at the app level
 // useInvisibleRecording();

  return (
    <div className="flex flex-col h-screen overflow-hidden overscroll-none dark:bg-dark">
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 min-w-0">
          <LiveStream />
        </div>
      </div> 
    </div>
  )
}