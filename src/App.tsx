import { LiveStream } from './components/LiveStream';
import { SimpleLandingPage } from './components/SimpleLandingPage';

import { SceneProvider } from './contexts/ScenesContext';
import { AuthProvider } from './contexts/SimpleAuthContext';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DocsPage } from './components/DocsPage';


import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import SceneConfigurator from './components/SceneConfigurator';
import { StreamConfigEditor } from './components/StreamConfigEditor';

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
                <Route path="/:modelName" element={<InnerApp />} />
                <Route path="/app" element={<InnerApp />} />
                <Route path="/configure" element={<StreamConfigEditor />} />
                <Route path="/docs" element={<DocsPage />} />
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
  useInvisibleRecording();

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