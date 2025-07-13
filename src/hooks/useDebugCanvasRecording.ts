import { useRef, useCallback, useState } from 'react';
import { useSceneEngine } from '../contexts/SceneEngineContext';

interface DebugRecordingState {
  isRecording: boolean;
  error: string | null;
  lastRecordingBlob: Blob | null;
  progress: number;
  debugInfo: string[];
}

export const useDebugCanvasRecording = () => {
  const { currentResponse, audioRef, bgmRef } = useSceneEngine();
  
  const [state, setState] = useState<DebugRecordingState>({
    isRecording: false,
    error: null,
    lastRecordingBlob: null,
    progress: 0,
    debugInfo: []
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const addDebugInfo = useCallback((info: string) => {
    console.log('🔍 Debug:', info);
    setState(prev => ({
      ...prev,
      debugInfo: [...prev.debugInfo.slice(-4), `${new Date().toLocaleTimeString()}: ${info}`]
    }));
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isRecording: true, error: null, progress: 0, debugInfo: [] }));
      addDebugInfo('Starting recording...');

      // Step 1: Find canvas
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) {
        throw new Error('No canvas found');
      }
      
      addDebugInfo(`Canvas found: ${canvas.width}x${canvas.height}`);

      // Step 2: Check canvas type
      const webglCtx = canvas.getContext('webgl') || canvas.getContext('webgl2');
      const is2D = canvas.getContext('2d');
      
      if (webglCtx) {
        addDebugInfo('WebGL canvas detected');
      } else if (is2D) {
        addDebugInfo('2D canvas detected');
      } else {
        addDebugInfo('Unknown canvas type');
      }

      // Step 3: Try screen capture first (for complete viewport), fallback to canvas
      let videoStream: MediaStream;
      
      try {
        // Try screen capture for full viewport including HTML elements
        addDebugInfo('Attempting screen capture...');
        
        videoStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 }
          },
          audio: false // We'll handle audio separately
        });
        
        addDebugInfo(`Screen capture successful: ${videoStream.getVideoTracks().length} tracks`);
        
        // Test if the stream has valid settings
        const track = videoStream.getVideoTracks()[0];
        if (track) {
          const settings = track.getSettings();
          addDebugInfo(`Screen stream settings: ${settings.width}x${settings.height}`);
        }
        
      } catch (error) {
        addDebugInfo(`Screen capture failed: ${error}`);
        addDebugInfo('Falling back to WebGL canvas capture...');
        
        try {
          // Fallback to direct canvas capture
          videoStream = canvas.captureStream(30);
          addDebugInfo(`WebGL canvas stream: ${videoStream.getVideoTracks().length} tracks`);
          
          const track = videoStream.getVideoTracks()[0];
          if (track) {
            const settings = track.getSettings();
            addDebugInfo(`Canvas stream settings: ${settings.width}x${settings.height}`);
          }
        } catch (canvasError) {
          addDebugInfo(`Canvas capture also failed: ${canvasError}`);
          throw new Error('Cannot capture any video stream');
        }
      }

      // Step 4: Add UI overlays (only if we have a 2D context)
      // This will be handled in the animation loop for WebGL canvas
      
      // Step 5: Video stream already created above

      // Step 6: Setup audio capture (BGM + TTS)
      let finalStream = videoStream;
      
      try {
        const audioContext = new AudioContext();
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
        
        const destination = audioContext.createMediaStreamDestination();
        let audioConnected = false;

        // Connect background music
        if (bgmRef.current) {
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
        if (audioRef.current) {
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

        // Connect any other audio elements
        const audioElements = document.querySelectorAll('audio');
        for (const audio of audioElements) {
          if (audio !== bgmRef.current && audio !== audioRef.current && !audio.paused) {
            try {
              const source = audioContext.createMediaElementSource(audio);
              const gain = audioContext.createGain();
              gain.gain.value = 0.5;
              
              source.connect(gain);
              gain.connect(destination);
              gain.connect(audioContext.destination);
              
              addDebugInfo(`Additional audio connected: ${audio.src.substring(0, 50)}`);
              audioConnected = true;
            } catch (error) {
              addDebugInfo(`Additional audio failed: ${error}`);
            }
          }
        }

        if (audioConnected) {
          finalStream = new MediaStream([
            ...videoStream.getVideoTracks(),
            ...destination.stream.getAudioTracks()
          ]);
          addDebugInfo(`Final stream: ${finalStream.getVideoTracks().length} video, ${finalStream.getAudioTracks().length} audio`);
        } else {
          addDebugInfo('No audio sources found');
        }
        
      } catch (error) {
        addDebugInfo(`Audio setup failed: ${error}`);
      }

      // Step 7: Setup MediaRecorder with basic settings
      let mimeType = 'video/webm';
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
        mimeType = 'video/webm;codecs=vp8';
      }

      const mediaRecorder = new MediaRecorder(finalStream, {
        mimeType,
        videoBitsPerSecond: 2000000,
        audioBitsPerSecond: 128000
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      addDebugInfo(`MediaRecorder created: ${mimeType}`);

      // Step 8: MediaRecorder events
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
      };

      mediaRecorder.onerror = (event) => {
        addDebugInfo(`MediaRecorder error: ${event.error}`);
        setState(prev => ({ 
          ...prev, 
          isRecording: false,
          error: `Recording error: ${event.error}`
        }));
      };

      // Step 9: Start recording
      mediaRecorder.start(1000);
      addDebugInfo('Recording started');

      // Step 10: Simple progress tracking (no canvas manipulation needed)
      const startTime = Date.now();
      
      const updateProgress = () => {
        if (mediaRecorder.state === 'recording') {
          // Update progress
          const elapsed = Date.now() - startTime;
          const progress = Math.min((elapsed / 5000) * 100, 100);
          setState(prev => ({ ...prev, progress }));
          
          setTimeout(updateProgress, 100);
        }
      };
      updateProgress();

      // Step 11: Auto-stop after 5 seconds
      timeoutRef.current = setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          addDebugInfo('Recording stopped (timeout)');
        }
      }, 5000);

    } catch (error) {
      const err = error as Error;
      addDebugInfo(`Error: ${err.message}`);
      setState(prev => ({ 
        ...prev, 
        isRecording: false,
        error: err.message
      }));
    }
  }, [currentResponse, bgmRef, addDebugInfo]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const downloadRecording = useCallback(() => {
    if (state.lastRecordingBlob) {
      const url = URL.createObjectURL(state.lastRecordingBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `debug-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [state.lastRecordingBlob]);

  return {
    state,
    startRecording,
    stopRecording,
    downloadRecording,
    isRecording: state.isRecording,
    error: state.error,
    progress: state.progress,
    debugInfo: state.debugInfo,
    lastRecordingBlob: state.lastRecordingBlob
  };
};