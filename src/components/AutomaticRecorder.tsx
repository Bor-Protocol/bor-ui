import React, { useEffect } from 'react';
import { useAutomaticRecording } from '../hooks/useAutomaticRecording';
import { useSceneEngine } from '../contexts/SceneEngineContext';

interface AutomaticRecorderProps {
  enabled: boolean;
}

export const AutomaticRecorder: React.FC<AutomaticRecorderProps> = ({ enabled }) => {
  const { currentResponse, audioData } = useSceneEngine();

  const {
    state,
    startAutomaticRecording,
    stopRecording,
    downloadRecording,
    isRecording,
    error,
    progress,
    debugInfo,
    permissionGranted,
    lastRecordingBlob
  } = useAutomaticRecording();

  if (!enabled) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black/90 backdrop-blur-sm rounded-lg p-4 text-white min-w-[300px] max-w-[400px]">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-3 h-3 rounded-full ${
          isRecording ? 'bg-red-500 animate-pulse' : 
          permissionGranted ? 'bg-green-500' : 
          'bg-yellow-500'
        }`} />
        <span className="text-sm font-medium">
          {isRecording ? 'Auto Recording...' : 
           permissionGranted ? 'Ready for Auto Recording' : 
           'Requesting Permission...'}
        </span>
      </div>

      {/* Permission Status */}
      {!permissionGranted && (
        <div className="mb-3 p-2 bg-yellow-500/20 border border-yellow-500 rounded text-yellow-300 text-xs">
          Please grant screen sharing permission when prompted. This will enable automatic recording.
        </div>
      )}

      {permissionGranted && !isRecording && (
        <div className="mb-3 p-2 bg-green-500/20 border border-green-500 rounded text-green-300 text-xs">
          ✅ Permission granted! Recording will start automatically when AI responds.
        </div>
      )}

      {/* Progress */}
      {isRecording && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Recording Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-red-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Status */}
      {error && (
        <div className="mb-3 p-2 bg-red-500/20 border border-red-500 rounded text-red-300 text-xs">
          {error}
        </div>
      )}

      {/* Manual Controls */}
      <div className="flex gap-2 mb-3">
        {permissionGranted && !isRecording && (
          <button
            onClick={startAutomaticRecording}
            className="flex-1 bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs transition-colors"
          >
            Manual Record
          </button>
        )}
        
        {isRecording && (
          <button
            onClick={stopRecording}
            className="flex-1 bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-xs transition-colors"
          >
            Stop Recording
          </button>
        )}
        
        {lastRecordingBlob && (
          <button
            onClick={() => downloadRecording()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs transition-colors"
          >
            Download
          </button>
        )}
      </div>

      {/* Info */}
      <div className="text-xs text-gray-400 space-y-1">
        <div>Audio: {audioData.isPlaying ? '🎵' : '🔇'}</div>
        <div>Response: {currentResponse?.id?.slice(-6) || 'None'}</div>
        <div>Permission: {permissionGranted ? '✅' : '❌'}</div>
        {lastRecordingBlob && (
          <div>Last: {(lastRecordingBlob.size / 1024).toFixed(1)} KB</div>
        )}
      </div>

      {/* Debug Log */}
      {debugInfo.length > 0 && (
        <div className="mt-3 p-2 bg-gray-800 rounded text-xs">
          <div className="font-medium text-blue-400 mb-1">Debug Log:</div>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {debugInfo.map((info, index) => (
              <div key={index} className="text-gray-300">
                {info}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      {!permissionGranted && (
        <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/30 rounded text-blue-300 text-xs">
          <strong>📋 Setup Instructions:</strong>
          <br />
          1. Click "Chrome Tab" when prompted
          <br />
          2. Select this browser tab
          <br />
          3. Click "Share"
          <br />
          4. Recording will then be automatic!
        </div>
      )}
    </div>
  );
};