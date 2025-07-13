import React, { useEffect, useRef } from 'react';
import { useDebugCanvasRecording } from '../hooks/useDebugCanvasRecording';
import { useSceneEngine } from '../contexts/SceneEngineContext';

interface DebugVideoRecorderProps {
  enabled: boolean;
}

export const DebugVideoRecorder: React.FC<DebugVideoRecorderProps> = ({ enabled }) => {
  const { currentResponse, audioData } = useSceneEngine();
  const lastResponseIdRef = useRef<string | null>(null);
  const recordingInProgressRef = useRef(false);

  const {
    state,
    startRecording,
    stopRecording,
    downloadRecording,
    isRecording,
    error,
    progress,
    debugInfo,
    lastRecordingBlob
  } = useDebugCanvasRecording();

  // Auto-trigger recording on new AI responses
  useEffect(() => {
    if (!enabled || !currentResponse || recordingInProgressRef.current) return;

    const isNewResponse = currentResponse.id !== lastResponseIdRef.current;
    
    if (isNewResponse) {
      console.log('🎬 Debug: Auto-triggering recording for response:', currentResponse.id);
      
      lastResponseIdRef.current = currentResponse.id;
      recordingInProgressRef.current = true;
      
      setTimeout(() => {
        startRecording();
      }, 500);
    }
  }, [enabled, currentResponse, startRecording]);

  // Reset recording flag when recording stops
  useEffect(() => {
    if (!isRecording && recordingInProgressRef.current) {
      recordingInProgressRef.current = false;
      
      if (lastRecordingBlob) {
        setTimeout(() => {
          downloadRecording();
        }, 1000);
      }
    }
  }, [isRecording, lastRecordingBlob, downloadRecording]);

  if (!enabled) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-black/90 backdrop-blur-sm rounded-lg p-4 text-white min-w-[300px] max-w-[400px]">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-3 h-3 rounded-full ${
          isRecording ? 'bg-red-500 animate-pulse' : 'bg-green-500'
        }`} />
        <span className="text-sm font-medium">
          {isRecording ? 'Debug Recording...' : 'Debug Recorder'}
        </span>
      </div>

      {/* Progress */}
      {isRecording && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progress</span>
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
        {!isRecording && (
          <>
            <button
              onClick={startRecording}
              className="flex-1 bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs transition-colors"
            >
              Start Test Recording
            </button>
            <button
              onClick={() => {
                // Debug chat elements
                const chatSelectors = [
                  '.live-chat',
                  '[class*="chat"]',
                  '[class*="LiveChat"]',
                  '[class*="Chat"]',
                  '[class*="message"]',
                  '[class*="comment"]'
                ];
                
                console.log('🔍 Chat Debug:');
                chatSelectors.forEach(selector => {
                  const elements = document.querySelectorAll(selector);
                  console.log(`${selector}: ${elements.length} elements`);
                  elements.forEach((el, i) => {
                    console.log(`  ${i}: ${el.className} - ${el.textContent?.substring(0, 50)}`);
                  });
                });
                
                // List all divs with potential chat content
                const allDivs = document.querySelectorAll('div');
                console.log(`\n📋 All divs: ${allDivs.length}`);
                allDivs.forEach((div, i) => {
                  if (div.textContent && div.textContent.trim().length > 10) {
                    console.log(`Div ${i}: ${div.className} - ${div.textContent.substring(0, 50)}`);
                  }
                });
              }}
              className="bg-yellow-600 hover:bg-yellow-700 px-2 py-1 rounded text-xs transition-colors"
            >
              Debug Chat
            </button>
          </>
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
            onClick={downloadRecording}
            className="flex-1 bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs transition-colors"
          >
            Download
          </button>
        )}
      </div>

      {/* Debug Info */}
      <div className="text-xs text-gray-400 space-y-1">
        <div>Audio: {audioData.isPlaying ? '🎵' : '🔇'}</div>
        <div>Response: {currentResponse?.id?.slice(-6) || 'None'}</div>
        {lastRecordingBlob && (
          <div>Last: {(lastRecordingBlob.size / 1024).toFixed(1)} KB</div>
        )}
      </div>

      {/* Debug Log */}
      {debugInfo.length > 0 && (
        <div className="mt-3 p-2 bg-gray-800 rounded text-xs">
          <div className="font-medium text-yellow-400 mb-1">Debug Log:</div>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {debugInfo.map((info, index) => (
              <div key={index} className="text-gray-300">
                {info}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};