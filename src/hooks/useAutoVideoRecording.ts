import { useRef, useCallback, useEffect, useState } from 'react';

interface AutoVideoRecordingOptions {
  duration: number; // Recording duration in seconds
  quality: 'high' | 'medium' | 'low';
  includeAudio: boolean;
  onRecordingComplete?: (blob: Blob) => void;
  onRecordingError?: (error: Error) => void;
}

interface RecordingState {
  isRecording: boolean;
  isProcessing: boolean;
  error: string | null;
  lastRecordingBlob: Blob | null;
}

export const useAutoVideoRecording = (options: AutoVideoRecordingOptions) => {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isProcessing: false,
    error: null,
    lastRecordingBlob: null
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const compositeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const destinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Initialize audio context for mixing
  useEffect(() => {
    if (options.includeAudio) {
      audioContextRef.current = new AudioContext();
      destinationRef.current = audioContextRef.current.createMediaStreamDestination();
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [options.includeAudio]);

  // Find and setup canvas reference
  const setupCanvasReference = useCallback(() => {
    // Try multiple selectors to find the Three.js canvas
    const selectors = [
      'canvas[data-engine="three.js r168"]',
      'canvas[data-engine*="three"]',
      'div[role="img"] canvas',
      '.r3f canvas',
      'canvas[width][height]',
      'canvas'
    ];

    for (const selector of selectors) {
      const canvas = document.querySelector(selector) as HTMLCanvasElement;
      if (canvas && canvas.getContext && canvas.width > 0 && canvas.height > 0) {
        canvasRef.current = canvas;
        console.log('✅ Found canvas:', {
          selector,
          width: canvas.width,
          height: canvas.height,
          context: canvas.getContext('2d') ? '2d' : 'webgl'
        });
        return true;
      }
    }

    // Debug: List all available canvases
    const allCanvases = document.querySelectorAll('canvas');
    console.log('❌ No suitable canvas found. Available canvases:', 
      Array.from(allCanvases).map(c => ({
        width: c.width,
        height: c.height,
        id: c.id,
        className: c.className
      }))
    );
    return false;
  }, []);

  // Create composite canvas with scene + UI overlay
  const createCompositeCanvas = useCallback(() => {
    if (!canvasRef.current) return null;

    const sourceCanvas = canvasRef.current;
    const composite = document.createElement('canvas');
    
    // Use fixed dimensions or canvas dimensions
    composite.width = sourceCanvas.width > 0 ? sourceCanvas.width : 1920;
    composite.height = sourceCanvas.height > 0 ? sourceCanvas.height : 1080;
    
    const ctx = composite.getContext('2d');
    if (!ctx) return null;

    compositeCanvasRef.current = composite;

    console.log('📽️ Created composite canvas:', {
      width: composite.width,
      height: composite.height,
      sourceWidth: sourceCanvas.width,
      sourceHeight: sourceCanvas.height
    });

    // Function to draw composite frame
    const drawCompositeFrame = () => {
      if (!ctx || !sourceCanvas) return;

      try {
        // Clear canvas
        ctx.clearRect(0, 0, composite.width, composite.height);

        // Draw 3D scene - handle both 2D and WebGL contexts
        if (sourceCanvas.width > 0 && sourceCanvas.height > 0) {
          ctx.drawImage(sourceCanvas, 0, 0, composite.width, composite.height);
        } else {
          // Fallback: draw a colored background
          ctx.fillStyle = '#1a1a1a';
          ctx.fillRect(0, 0, composite.width, composite.height);
        }

        // Draw UI overlay (chat, AI response, etc.)
        drawUIOverlay(ctx, composite.width, composite.height);
      } catch (error) {
        console.error('Error drawing composite frame:', error);
      }
    };

    return { composite, drawCompositeFrame };
  }, []);

  // Draw UI elements on canvas
  const drawUIOverlay = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Find chat container
    const chatContainer = document.querySelector('.live-chat, [class*="chat"]');
    if (chatContainer) {
      const rect = chatContainer.getBoundingClientRect();
      const chatCanvas = document.createElement('canvas');
      const chatCtx = chatCanvas.getContext('2d');
      
      if (chatCtx) {
        chatCanvas.width = rect.width;
        chatCanvas.height = rect.height;
        
        // Draw chat background
        chatCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        chatCtx.fillRect(0, 0, rect.width, rect.height);
        
        // Draw chat messages
        const messages = chatContainer.querySelectorAll('.message, [class*="message"]');
        messages.forEach((msg, index) => {
          const msgRect = msg.getBoundingClientRect();
          const relativeTop = msgRect.top - rect.top;
          
          chatCtx.fillStyle = 'white';
          chatCtx.font = '14px Arial';
          chatCtx.fillText(msg.textContent || '', 10, relativeTop + 20);
        });
        
        // Draw chat on main canvas
        ctx.drawImage(chatCanvas, width - rect.width - 20, 20);
      }
    }

    // Find AI response display
    const aiResponse = document.querySelector('.ai-response, [class*="ai-response"]');
    if (aiResponse) {
      const rect = aiResponse.getBoundingClientRect();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(20, height - rect.height - 20, rect.width, rect.height);
      
      ctx.fillStyle = 'white';
      ctx.font = '16px Arial';
      ctx.fillText(aiResponse.textContent || '', 30, height - rect.height + 10);
    }
  }, []);

  // Setup audio mixing
  const setupAudioMixing = useCallback(async () => {
    if (!audioContextRef.current || !destinationRef.current) return null;

    const audioContext = audioContextRef.current;
    const destination = destinationRef.current;

    // Connect background music
    const bgmAudio = document.querySelector('audio[src*="musicbg"]') as HTMLAudioElement;
    if (bgmAudio) {
      const bgmSource = audioContext.createMediaElementSource(bgmAudio);
      const bgmGain = audioContext.createGain();
      bgmGain.gain.value = 0.3;
      bgmSource.connect(bgmGain).connect(destination);
    }

    // Connect TTS audio
    const ttsAudio = document.querySelector('audio[src*="tts"], audio[src*="audio"]') as HTMLAudioElement;
    if (ttsAudio) {
      const ttsSource = audioContext.createMediaElementSource(ttsAudio);
      const ttsGain = audioContext.createGain();
      ttsGain.gain.value = 0.7;
      ttsSource.connect(ttsGain).connect(destination);
    }

    return destination.stream;
  }, []);

  // Start automatic recording
  const startRecording = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isRecording: true, error: null, isProcessing: true }));

      // Setup canvas
      if (!setupCanvasReference()) {
        throw new Error('No canvas found for recording');
      }

      // Create composite canvas
      const canvasSetup = createCompositeCanvas();
      if (!canvasSetup) {
        throw new Error('Failed to create composite canvas');
      }

      const { composite, drawCompositeFrame } = canvasSetup;

      // Draw first frame to ensure canvas has content
      drawCompositeFrame();

      // Get video stream from composite canvas
      const videoStream = composite.captureStream(30);
      
      console.log('📺 Video stream created:', {
        tracks: videoStream.getVideoTracks().length,
        settings: videoStream.getVideoTracks()[0]?.getSettings()
      });

      // Setup audio if enabled
      let finalStream = videoStream;
      if (options.includeAudio) {
        const audioStream = await setupAudioMixing();
        if (audioStream) {
          finalStream = new MediaStream([
            ...videoStream.getVideoTracks(),
            ...audioStream.getAudioTracks()
          ]);
          console.log('🔊 Audio stream added:', audioStream.getAudioTracks().length, 'tracks');
        }
      }

      // Configure MediaRecorder with fallback MIME types
      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8,opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }
      }

      const quality = options.quality === 'high' ? 
        { videoBitsPerSecond: 8000000, audioBitsPerSecond: 128000 } :
        options.quality === 'medium' ?
        { videoBitsPerSecond: 4000000, audioBitsPerSecond: 96000 } :
        { videoBitsPerSecond: 2000000, audioBitsPerSecond: 64000 };

      const mediaRecorder = new MediaRecorder(finalStream, {
        mimeType,
        ...quality
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      console.log('🎬 MediaRecorder configured:', {
        mimeType,
        state: mediaRecorder.state,
        ...quality
      });

      // Start continuous frame drawing
      const drawLoop = () => {
        if (mediaRecorder.state === 'recording') {
          drawCompositeFrame();
          requestAnimationFrame(drawLoop);
        }
      };

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          console.log('📦 Data chunk received:', event.data.size, 'bytes');
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        console.log('✅ Recording completed:', {
          size: blob.size,
          chunks: chunksRef.current.length,
          type: blob.type
        });
        
        setState(prev => ({ 
          ...prev, 
          isRecording: false, 
          isProcessing: false,
          lastRecordingBlob: blob 
        }));
        
        if (options.onRecordingComplete) {
          options.onRecordingComplete(blob);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event);
        const error = new Error(`Recording failed: ${event.error || 'Unknown error'}`);
        setState(prev => ({ 
          ...prev, 
          isRecording: false, 
          isProcessing: false,
          error: error.message 
        }));
        
        if (options.onRecordingError) {
          options.onRecordingError(error);
        }
      };

      // Start recording
      mediaRecorder.start(1000);
      drawLoop();

      setState(prev => ({ ...prev, isProcessing: false }));

      // Auto-stop after specified duration
      recordingTimeoutRef.current = setTimeout(() => {
        stopRecording();
      }, options.duration * 1000);

      console.log('🎬 Automatic recording started');

    } catch (error) {
      const err = error as Error;
      setState(prev => ({ 
        ...prev, 
        isRecording: false, 
        isProcessing: false,
        error: err.message 
      }));
      
      if (options.onRecordingError) {
        options.onRecordingError(err);
      }
      
      console.error('❌ Recording failed:', err);
    }
  }, [options, setupCanvasReference, createCompositeCanvas, setupAudioMixing]);

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
      a.download = `bor-auto-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
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
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
    };
  }, [stopRecording]);

  return {
    state,
    startRecording,
    stopRecording,
    downloadRecording,
    isRecording: state.isRecording,
    isProcessing: state.isProcessing,
    error: state.error,
    lastRecordingBlob: state.lastRecordingBlob
  };
};