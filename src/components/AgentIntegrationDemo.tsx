import React, { useEffect, useState } from 'react';
import { useAgentIntegration } from '../hooks/useAgentIntegration';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../hooks/useSocket';

export const AgentIntegrationDemo: React.FC = () => {
  const { isAuthenticated, user, token } = useAuth();
  const [demoStep, setDemoStep] = useState(0);
  
  const {
    selectedAgentId,
    currentScene,
    hasValidModel,
    sceneInfo,
    selectAgent,
    startPrivateSession,
    canStartPrivateSession,
    active3DScene
  } = useAgentIntegration();

  const {
    peerCount,
    isServerOnline,
    isAuthenticated: socketAuthenticated,
    authenticatedUser: socketUser
  } = useSocket(token);

  const demoSteps = [
    {
      title: "Authentication Status",
      description: "Check if user is properly authenticated with JWT",
      component: () => (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg ${isAuthenticated ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
              <h4 className="font-medium">Frontend Auth</h4>
              <p className="text-sm">{isAuthenticated ? '✅ Authenticated' : '❌ Not authenticated'}</p>
              {user && <p className="text-xs text-gray-600">User: {user.email}</p>}
            </div>
            <div className={`p-4 rounded-lg ${socketAuthenticated ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
              <h4 className="font-medium">Socket Auth</h4>
              <p className="text-sm">{socketAuthenticated ? '✅ Socket authenticated' : '❌ Socket not authenticated'}</p>
              {socketUser && <p className="text-xs text-gray-600">Socket User: {socketUser.email}</p>}
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Server: {isServerOnline ? '🟢 Online' : '🔴 Offline'}</span>
            <span>Connected users: {peerCount}</span>
          </div>
        </div>
      )
    },
    {
      title: "Agent Selection Integration",
      description: "Select an agent and see how it integrates with the 3D system",
      component: () => (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['795df77f-1620-07db-bd9a-0e2dfefef248', 'bor-agent-001', 'trump-variant-001'].map((agentId, index) => (
              <button
                key={agentId}
                onClick={() => selectAgent(agentId)}
                className={`p-4 rounded-lg border text-left transition-all ${
                  selectedAgentId === agentId 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">Agent {index + 1}</div>
                <div className="text-sm text-gray-600">{agentId.slice(0, 8)}...</div>
                {selectedAgentId === agentId && <div className="text-xs text-blue-600 mt-1">✓ Selected</div>}
              </button>
            ))}
          </div>
          
          {selectedAgentId && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Selected Agent Details</h4>
              <div className="text-sm space-y-1">
                <p><strong>Agent ID:</strong> {selectedAgentId}</p>
                <p><strong>Has Valid Model:</strong> {hasValidModel ? '✅ Yes' : '❌ No'}</p>
                <p><strong>Scene Title:</strong> {currentScene?.title || 'N/A'}</p>
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      title: "3D Scene Configuration",
      description: "View the 3D scene configuration that will be rendered",
      component: () => (
        <div className="space-y-4">
          {sceneInfo ? (
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium mb-3">3D Scene Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Scene:</strong> {sceneInfo.sceneName}
                </div>
                <div>
                  <strong>Agent ID:</strong> {sceneInfo.agentId}
                </div>
                <div>
                  <strong>Model File:</strong> {sceneInfo.modelFile}
                </div>
                <div>
                  <strong>Environment:</strong> {sceneInfo.environment}
                </div>
                <div>
                  <strong>Default Animation:</strong> {sceneInfo.defaultAnimation}
                </div>
                <div>
                  <strong>Position:</strong> [{sceneInfo.position?.join(', ')}]
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">No scene selected. Please select an agent first.</p>
            </div>
          )}
          
          {active3DScene && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">Active 3D Scene</h4>
              <p className="text-sm text-blue-700">{active3DScene.title}</p>
              <p className="text-xs text-blue-600">{active3DScene.description}</p>
            </div>
          )}
        </div>
      )
    },
    {
      title: "Session Management",
      description: "Test private session functionality",
      component: () => (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg border">
            <h4 className="font-medium mb-4">Private Session</h4>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Authentication:</span>
                <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                  {isAuthenticated ? '✅ Ready' : '❌ Required'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Agent Selected:</span>
                <span className={selectedAgentId ? 'text-green-600' : 'text-red-600'}>
                  {selectedAgentId ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Points Available:</span>
                <span className={user && user.points >= 10 ? 'text-green-600' : 'text-red-600'}>
                  {user ? `${user.points} points` : 'N/A'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Can Start Session:</span>
                <span className={canStartPrivateSession ? 'text-green-600' : 'text-red-600'}>
                  {canStartPrivateSession ? '✅ Yes' : '❌ No'}
                </span>
              </div>
            </div>
            
            <button
              onClick={startPrivateSession}
              disabled={!canStartPrivateSession}
              className={`w-full mt-4 px-4 py-2 rounded-md font-medium ${
                canStartPrivateSession
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Start Private Session (10 points)
            </button>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Agent Integration Demo</h1>
        <p className="text-gray-600">
          This demo shows how authentication, agent selection, and 3D scene integration work together.
        </p>
      </div>

      {/* Step Navigation */}
      <div className="flex space-x-2 mb-8 overflow-x-auto">
        {demoSteps.map((step, index) => (
          <button
            key={index}
            onClick={() => setDemoStep(index)}
            className={`flex-shrink-0 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              demoStep === index
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {index + 1}. {step.title}
          </button>
        ))}
      </div>

      {/* Current Step Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-2">{demoSteps[demoStep].title}</h2>
        <p className="text-gray-600 mb-6">{demoSteps[demoStep].description}</p>
        
        {demoSteps[demoStep].component()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => setDemoStep(Math.max(0, demoStep - 1))}
          disabled={demoStep === 0}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        <button
          onClick={() => setDemoStep(Math.min(demoSteps.length - 1, demoStep + 1))}
          disabled={demoStep === demoSteps.length - 1}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>

      {/* Integration Status Summary */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium mb-2">Integration Status Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className={`text-2xl ${isAuthenticated ? 'text-green-500' : 'text-red-500'}`}>
              {isAuthenticated ? '✅' : '❌'}
            </div>
            <div>Authentication</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl ${selectedAgentId ? 'text-green-500' : 'text-red-500'}`}>
              {selectedAgentId ? '✅' : '❌'}
            </div>
            <div>Agent Selected</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl ${hasValidModel ? 'text-green-500' : 'text-red-500'}`}>
              {hasValidModel ? '✅' : '❌'}
            </div>
            <div>3D Model Ready</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl ${socketAuthenticated ? 'text-green-500' : 'text-red-500'}`}>
              {socketAuthenticated ? '✅' : '❌'}
            </div>
            <div>Socket Connected</div>
          </div>
        </div>
      </div>
    </div>
  );
};