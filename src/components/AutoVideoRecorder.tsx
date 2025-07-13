import React, { useEffect, useRef } from 'react';
import { useCanvasAutoRecording } from '../hooks/useCanvasAutoRecording';
import { useSceneEngine } from '../contexts/SceneEngineContext';

interface AutoVideoRecorderProps {
  enabled: boolean;
  recordingDuration: number;
  quality: 'high' | 'medium' | 'low';
  fps?: number;
  onRecordingComplete?: (blob: Blob) => void;
  autoDownload?: boolean;
}

export const AutoVideoRecorder: React.FC<AutoVideoRecorderProps> = ({
  enabled,
  recordingDuration,
  quality,
  fps = 30,
  onRecordingComplete,
  autoDownload = false
}) => {
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
    lastRecordingBlob
  } = useCanvasAutoRecording({
    duration: recordingDuration,
    fps,
    quality,
    onRecordingComplete: (blob) => {
      recordingInProgressRef.current = false;
      console.log('🎬 Canvas recording completed:', blob.size, 'bytes');
      
      if (onRecordingComplete) {
        onRecordingComplete(blob);
      }
      
      if (autoDownload) {
        setTimeout(() => {
          downloadRecording();
        }, 1000);
      }
    },
    onRecordingError: (err) => {
      recordingInProgressRef.current = false;
      console.error('❌ Canvas recording error:', err);
    }
  });

  // Automatically trigger recording on new AI responses
  useEffect(() => {
    if (!enabled || !currentResponse) return;

    // Check if this is a new response
    const isNewResponse = currentResponse.id !== lastResponseIdRef.current;
    
    // Only record if:
    // 1. It's a new response
    // 2. Not already recording
    // 3. Audio is playing (indicates TTS is active)
    if (isNewResponse && !recordingInProgressRef.current && audioData.isPlaying) {
      console.log('🎬 Auto-triggering recording for response:', currentResponse.id);
      
      lastResponseIdRef.current = currentResponse.id;
      recordingInProgressRef.current = true;
      
      // Small delay to ensure audio has started
      setTimeout(() => {
        startRecording();
      }, 500);
    }
  }, [enabled, currentResponse, audioData.isPlaying, startRecording]);

  // Auto-download completed recordings
  useEffect(() => {
    if (lastRecordingBlob && autoDownload && !isRecording) {
      downloadRecording();
    }
  }, [lastRecordingBlob, autoDownload, isRecording, downloadRecording]);

  if (!enabled) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-white min-w-[200px]">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${
          isRecording ? 'bg-red-500 animate-pulse' : 'bg-green-500'
        }`} />
        <span className="text-sm font-medium">
          {isRecording ? 'Recording...' : 'Auto Recorder'}
        </span>
      </div>

      {/* Recording Info */}
      <div className="text-xs text-gray-300 space-y-1">
        <div>Duration: {recordingDuration}s</div>
        <div>Mode: Canvas Direct</div>
        <div>FPS: {fps}</div>
        <div>Auto-download: {autoDownload ? 'ON' : 'OFF'}</div>
      </div>

      {/* Progress Bar */}
      {isRecording && (
        <div className="mt-2">
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
        <div className="mt-2 p-2 bg-red-500/20 border border-red-500 rounded text-red-300 text-xs">
          {error}
        </div>
      )}

      {lastRecordingBlob && !autoDownload && (
        <button
          onClick={downloadRecording}
          className="mt-2 w-full bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs transition-colors"
        >
          Download Last Recording
        </button>
      )}

      {/* Debug Info */}
      <div className="mt-2 text-xs text-gray-400">
        <div>Audio: {audioData.isPlaying ? '🎵' : '🔇'}</div>
        <div>Response: {currentResponse?.id?.slice(-6) || 'None'}</div>
      </div>
    </div>
  );
};