import { useRef, useCallback, useState } from 'react';
import { useSceneEngine } from '../contexts/SceneEngineContext';

interface ViewportRecordingState {
  isRecording: boolean;
  error: string | null;
  lastRecordingBlob: Blob | null;
  progress: number;
  debugInfo: string[];
}

export const useViewportRecording = () => {
  const { currentResponse, audioRef, bgmRef } = useSceneEngine();
  
  const [state, setState] = useState<ViewportRecordingState>({
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
    console.log('🔍 Viewport Debug:', info);
    setState(prev => ({
      ...prev,
      debugInfo: [...prev.debugInfo.slice(-4), `${new Date().toLocaleTimeString()}: ${info}`]
    }));
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isRecording: true, error: null, progress: 0, debugInfo: [] }));
      addDebugInfo('Starting viewport recording...');

      // Method 1: Try html2canvas-like approach using DOM-to-canvas
      const rootElement = document.documentElement;
      const canvas = document.createElement('canvas');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Cannot create canvas context');
      }

      addDebugInfo(`Canvas created: ${canvas.width}x${canvas.height}`);

      // Function to capture viewport
      const captureViewport = async () => {
        try {
          // Create a copy of the current viewport
          const viewportData = await html2canvas(rootElement, {
            width: window.innerWidth,
            height: window.innerHeight,
            allowTaint: true,
            useCORS: true,
            scale: 1,
            logging: false
          });
          
          // Draw to our canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(viewportData, 0, 0);
          
          addDebugInfo('Viewport captured successfully');
        } catch (error) {
          addDebugInfo(`Viewport capture failed: ${error}`);
          
          // Fallback: capture just the WebGL canvas
          const webglCanvas = document.querySelector('canvas');
          if (webglCanvas) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(webglCanvas, 0, 0, canvas.width, canvas.height);
            addDebugInfo('Fallback: WebGL canvas captured');
          }
        }
      };

      // Initial capture
      await captureViewport();

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

      // Animation loop to continuously capture viewport
      const startTime = Date.now();
      const animate = async () => {
        if (mediaRecorder.state === 'recording') {
          await captureViewport();
          
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
      a.download = `viewport-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
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

// Simplified html2canvas function
const html2canvas = async (element: HTMLElement, options: any): Promise<HTMLCanvasElement> => {
  const canvas = document.createElement('canvas');
  canvas.width = options.width;
  canvas.height = options.height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Cannot create canvas context');
  }

  // This is a simplified approach - in a real implementation you'd need html2canvas library
  // For now, we'll just capture the WebGL canvas
  const webglCanvas = document.querySelector('canvas');
  if (webglCanvas) {
    ctx.drawImage(webglCanvas, 0, 0, canvas.width, canvas.height);
  }
  
  return canvas;
};