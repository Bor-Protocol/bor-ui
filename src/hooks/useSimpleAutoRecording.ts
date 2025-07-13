import { useRef, useCallback, useEffect, useState } from 'react';

interface SimpleAutoRecordingOptions {
  duration: number;
  onRecordingComplete?: (blob: Blob) => void;
  onRecordingError?: (error: Error) => void;
}

interface RecordingState {
  isRecording: boolean;
  error: string | null;
  lastRecordingBlob: Blob | null;
}

export const useSimpleAutoRecording = (options: SimpleAutoRecordingOptions) => {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    error: null,
    lastRecordingBlob: null
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Start recording with screen sharing
  const startRecording = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isRecording: true, error: null }));

      // Request screen sharing with audio
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: true
      });

      console.log('📺 Screen sharing started:', {
        video: stream.getVideoTracks().length,
        audio: stream.getAudioTracks().length
      });

      // Configure MediaRecorder
      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8,opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 5000000,
        audioBitsPerSecond: 128000,
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          console.log('📦 Data chunk:', event.data.size, 'bytes');
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        console.log('✅ Recording completed:', blob.size, 'bytes');
        
        setState(prev => ({ 
          ...prev, 
          isRecording: false,
          lastRecordingBlob: blob 
        }));
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        if (options.onRecordingComplete) {
          options.onRecordingComplete(blob);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('❌ Recording error:', event);
        const error = new Error('Recording failed');
        setState(prev => ({ 
          ...prev, 
          isRecording: false,
          error: error.message 
        }));
        
        if (options.onRecordingError) {
          options.onRecordingError(error);
        }
      };

      // Start recording
      mediaRecorder.start(1000);

      // Auto-stop after specified duration
      recordingTimeoutRef.current = setTimeout(() => {
        stopRecording();
      }, options.duration * 1000);

      console.log('🎬 Recording started');

    } catch (error) {
      const err = error as Error;
      setState(prev => ({ 
        ...prev, 
        isRecording: false,
        error: err.message 
      }));
      
      if (options.onRecordingError) {
        options.onRecordingError(err);
      }
      
      console.error('❌ Recording failed:', err);
    }
  }, [options]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
  }, []);

  // Download recording
  const downloadRecording = useCallback(() => {
    if (state.lastRecordingBlob) {
      const url = URL.createObjectURL(state.lastRecordingBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bor-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [state.lastRecordingBlob]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  return {
    state,
    startRecording,
    stopRecording,
    downloadRecording,
    isRecording: state.isRecording,
    error: state.error,
    lastRecordingBlob: state.lastRecordingBlob
  };
};