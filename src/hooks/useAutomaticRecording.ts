import { useRef, useCallback, useState, useEffect } from 'react';
import { useSceneEngine } from '../contexts/SceneEngineContext';

interface AutomaticRecordingState {
  isRecording: boolean;
  error: string | null;
  lastRecordingBlob: Blob | null;
  progress: number;
  debugInfo: string[];
  permissionGranted: boolean;
}

export const useAutomaticRecording = () => {
  const { currentResponse, audioRef, bgmRef } = useSceneEngine();
  
  const [state, setState] = useState<AutomaticRecordingState>({
    isRecording: false,
    error: null,
    lastRecordingBlob: null,
    progress: 0,
    debugInfo: [],
    permissionGranted: false
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const addDebugInfo = useCallback((info: string) => {
    console.log('🔍 Auto Debug:', info);
    setState(prev => ({
      ...prev,
      debugInfo: [...prev.debugInfo.slice(-4), `${new Date().toLocaleTimeString()}: ${info}`]
    }));
  }, []);

  // Initialize screen sharing permission on component mount
  useEffect(() => {
    const initializePermission = async () => {
      try {
        addDebugInfo('Requesting initial screen sharing permission...');
        
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 }
          },
          audio: true,
          // Request specific preference for current tab
          preferCurrentTab: true
        });
        
        // Store the stream for later use
        streamRef.current = stream;
        
        addDebugInfo('✅ Screen sharing permission granted and stream ready');
        setState(prev => ({ ...prev, permissionGranted: true }));
        
        // Don't start recording yet - just keep the stream ready
        // The stream will be used when recording is triggered
        
      } catch (error) {
        addDebugInfo(`❌ Screen sharing permission denied: ${error}`);
        setState(prev => ({ ...prev, permissionGranted: false }));
      }
    };

    initializePermission();

    // Cleanup on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [addDebugInfo]);

  const startAutomaticRecording = useCallback(async () => {
    try {
      if (!streamRef.current) {
        throw new Error('No screen sharing stream available');
      }

      setState(prev => ({ ...prev, isRecording: true, error: null, progress: 0 }));
      addDebugInfo('Starting automatic recording...');

      // Use the pre-authorized stream
      const videoStream = streamRef.current;
      addDebugInfo(`Using existing stream: ${videoStream.getVideoTracks().length} video, ${videoStream.getAudioTracks().length} audio`);

      // Setup additional audio if needed
      let finalStream = videoStream;
      
      try {
        const audioContext = new AudioContext();
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
        
        const destination = audioContext.createMediaStreamDestination();
        let audioConnected = false;

        // Connect existing screen audio if available
        const existingAudio = videoStream.getAudioTracks();
        if (existingAudio.length > 0) {
          addDebugInfo('Using screen audio from display capture');
          audioConnected = true;
        }

        // Connect background music
        if (bgmRef.current && !bgmRef.current.paused) {
          try {
            const bgmSource = audioContext.createMediaElementSource(bgmRef.current);
            const bgmGain = audioContext.createGain();
            bgmGain.gain.value = 0.3;
            
            bgmSource.connect(bgmGain);
            bgmGain.connect(destination);
            bgmGain.connect(audioContext.destination);
            
            addDebugInfo('BGM audio connected');
            audioConnected = true;
          } catch (error) {
            addDebugInfo(`BGM connection failed: ${error}`);
          }
        }

        // Connect TTS audio
        if (audioRef.current && !audioRef.current.paused) {
          try {
            const ttsSource = audioContext.createMediaElementSource(audioRef.current);
            const ttsGain = audioContext.createGain();
            ttsGain.gain.value = 0.7;
            
            ttsSource.connect(ttsGain);
            ttsGain.connect(destination);
            ttsGain.connect(audioContext.destination);
            
            addDebugInfo('TTS audio connected');
            audioConnected = true;
          } catch (error) {
            addDebugInfo(`TTS connection failed: ${error}`);
          }
        }

        // Combine all audio sources
        if (audioConnected) {
          const allAudioTracks = [
            ...videoStream.getAudioTracks(),
            ...destination.stream.getAudioTracks()
          ];
          
          finalStream = new MediaStream([
            ...videoStream.getVideoTracks(),
            ...allAudioTracks
          ]);
          
          addDebugInfo(`Final stream: ${finalStream.getVideoTracks().length} video, ${finalStream.getAudioTracks().length} audio`);
        }
        
      } catch (error) {
        addDebugInfo(`Audio setup failed: ${error}`);
      }

      // Setup MediaRecorder
      let mimeType = 'video/webm';
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
        mimeType = 'video/webm;codecs=vp8,opus';
      }

      const mediaRecorder = new MediaRecorder(finalStream, {
        mimeType,
        videoBitsPerSecond: 3000000,
        audioBitsPerSecond: 128000
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          addDebugInfo(`Data chunk: ${event.data.size} bytes`);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        addDebugInfo(`Recording completed: ${blob.size} bytes`);
        
        setState(prev => ({ 
          ...prev, 
          isRecording: false,
          lastRecordingBlob: blob,
          progress: 100
        }));
        
        // Auto-download
        setTimeout(() => {
          downloadRecording(blob);
        }, 1000);
      };

      mediaRecorder.onerror = (event) => {
        addDebugInfo(`MediaRecorder error: ${event.error}`);
        setState(prev => ({ 
          ...prev, 
          isRecording: false,
          error: `Recording error: ${event.error}`
        }));
      };

      // Start recording
      mediaRecorder.start(1000);
      addDebugInfo('Recording started automatically');

      // Progress tracking
      const startTime = Date.now();
      const updateProgress = () => {
        if (mediaRecorder.state === 'recording') {
          const elapsed = Date.now() - startTime;
          const progress = Math.min((elapsed / 120000) * 100, 100);
          setState(prev => ({ ...prev, progress }));
          
          setTimeout(updateProgress, 1000); // Update every second instead of 100ms
        }
      };
      updateProgress();

      // Auto-stop after 2 minutes (120 seconds)
      timeoutRef.current = setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          addDebugInfo('Recording stopped automatically after 2 minutes');
        }
      }, 120000);

    } catch (error) {
      const err = error as Error;
      addDebugInfo(`Error: ${err.message}`);
      setState(prev => ({ 
        ...prev, 
        isRecording: false,
        error: err.message
      }));
    }
  }, [bgmRef, audioRef, addDebugInfo]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const downloadRecording = useCallback((blob?: Blob) => {
    const recordingBlob = blob || state.lastRecordingBlob;
    if (recordingBlob) {
      const url = URL.createObjectURL(recordingBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `auto-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [state.lastRecordingBlob]);

  // Auto-trigger recording when AI responses start
  useEffect(() => {
    if (currentResponse && state.permissionGranted && !state.isRecording) {
      addDebugInfo(`Auto-triggering recording for response: ${currentResponse.id}`);
      setTimeout(() => {
        startAutomaticRecording();
      }, 500);
    }
  }, [currentResponse, state.permissionGranted, state.isRecording, startAutomaticRecording, addDebugInfo]);

  return {
    state,
    startAutomaticRecording,
    stopRecording,
    downloadRecording,
    isRecording: state.isRecording,
    error: state.error,
    progress: state.progress,
    debugInfo: state.debugInfo,
    permissionGranted: state.permissionGranted,
    lastRecordingBlob: state.lastRecordingBlob
  };
};