import { useRef, useCallback, useState } from 'react';
import { useSceneEngine } from '../contexts/SceneEngineContext';

interface FullScreenRecordingState {
  isRecording: boolean;
  error: string | null;
  lastRecordingBlob: Blob | null;
  progress: number;
  debugInfo: string[];
}

export const useFullScreenRecording = () => {
  const { currentResponse, audioRef, bgmRef } = useSceneEngine();
  
  const [state, setState] = useState<FullScreenRecordingState>({
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
    console.log('🔍 FullScreen Debug:', info);
    setState(prev => ({
      ...prev,
      debugInfo: [...prev.debugInfo.slice(-4), `${new Date().toLocaleTimeString()}: ${info}`]
    }));
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isRecording: true, error: null, progress: 0, debugInfo: [] }));
      addDebugInfo('Starting full screen recording...');

      // Create a composite canvas that captures the entire viewport
      const canvas = document.createElement('canvas');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Cannot create canvas context');
      }

      addDebugInfo(`Canvas created: ${canvas.width}x${canvas.height}`);

      // Function to capture the entire screen content
      const captureScreen = () => {
        // Clear canvas
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Capture WebGL canvas (3D scene)
        const webglCanvas = document.querySelector('canvas');
        if (webglCanvas) {
          try {
            ctx.drawImage(webglCanvas, 0, 0, canvas.width, canvas.height);
            addDebugInfo('WebGL canvas captured');
          } catch (error) {
            addDebugInfo(`WebGL canvas capture failed: ${error}`);
          }
        }
        
        // Capture HTML elements by converting them to canvas
        const elements = document.querySelectorAll('*');
        elements.forEach(element => {
          const rect = element.getBoundingClientRect();
          const styles = window.getComputedStyle(element);
          
          // Only capture visible elements with content
          if (rect.width > 0 && rect.height > 0 && 
              styles.visibility !== 'hidden' && 
              styles.display !== 'none' &&
              element.textContent?.trim()) {
            
            try {
              // Draw text elements
              if (element.tagName === 'DIV' || element.tagName === 'SPAN' || element.tagName === 'P') {
                const text = element.textContent?.trim();
                if (text && text.length > 0) {
                  ctx.fillStyle = styles.color || 'white';
                  ctx.font = `${styles.fontSize || '16px'} ${styles.fontFamily || 'Arial'}`;
                  ctx.fillText(text.substring(0, 100), rect.left, rect.top + 20);
                }
              }
              
              // Draw background colors
              if (styles.backgroundColor && styles.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                ctx.fillStyle = styles.backgroundColor;
                ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
              }
              
            } catch (error) {
              // Ignore individual element errors
            }
          }
        });
      };

      // Initial capture
      captureScreen();

      // Get video stream
      const videoStream = canvas.captureStream(30);
      addDebugInfo(`Video stream: ${videoStream.getVideoTracks().length} tracks`);

      // Setup audio capture
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

        if (audioConnected) {
          finalStream = new MediaStream([
            ...videoStream.getVideoTracks(),
            ...destination.stream.getAudioTracks()
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
        videoBitsPerSecond: 2000000,
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
      addDebugInfo('Recording started');

      // Animation loop to continuously capture screen
      const startTime = Date.now();
      const animate = () => {
        if (mediaRecorder.state === 'recording') {
          captureScreen();
          
          // Update progress
          const elapsed = Date.now() - startTime;
          const progress = Math.min((elapsed / 5000) * 100, 100);
          setState(prev => ({ ...prev, progress }));
          
          requestAnimationFrame(animate);
        }
      };
      animate();

      // Auto-stop after 5 seconds
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
  }, [currentResponse, bgmRef, audioRef, addDebugInfo]);

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
      a.download = `fullscreen-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
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