import { LiveStream } from './components/LiveStream';

import { SceneProvider } from './contexts/ScenesContext';
import { ChatVisibilityProvider } from './contexts/ChatVisibilityContext';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DocsPage } from './components/DocsPage';


import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import SceneConfigurator from './components/SceneConfigurator';
import { StreamConfigEditor } from './components/StreamConfigEditor';

const queryClient = new QueryClient();

import { SceneEngineProvider } from './contexts/SceneEngineContext';

export default function App() {

  return (
    <QueryClientProvider client={queryClient}>
              <Router>
                  <SceneProvider>
                      <SceneEngineProvider>
                          <Routes>
                            <Route path="/:modelName" element={<InnerApp />} />
                            <Route path="/" element={<InnerApp />} />
                            <Route path="/configure" element={<StreamConfigEditor />} />
                            <Route path="/docs" element={<DocsPage />} />
                          </Routes>      
                      </SceneEngineProvider>
                  </SceneProvider>
              </Router>
    </QueryClientProvider>
  );
}


const InnerApp = () => {
  return (
    <ChatVisibilityProvider>
      <div className="flex flex-col h-screen overflow-hidden overscroll-none dark:bg-dark">
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 min-w-0">
            <LiveStream />
          </div>
        </div> 
      </div>
    </ChatVisibilityProvider>
  )
}