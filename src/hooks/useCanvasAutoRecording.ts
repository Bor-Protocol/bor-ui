import { useRef, useCallback, useEffect, useState } from 'react';
import { useSceneEngine } from '../contexts/SceneEngineContext';

interface CanvasAutoRecordingOptions {
  duration: number;
  fps: number;
  quality: 'high' | 'medium' | 'low';
  onRecordingComplete?: (blob: Blob) => void;
  onRecordingError?: (error: Error) => void;
}

interface RecordingState {
  isRecording: boolean;
  error: string | null;
  lastRecordingBlob: Blob | null;
  progress: number;
}

export const useCanvasAutoRecording = (options: CanvasAutoRecordingOptions) => {
  const { currentResponse, audioRef, bgmRef } = useSceneEngine();
  
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    error: null,
    lastRecordingBlob: null,
    progress: 0
  });

  const compositeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Quality settings
  const getQualitySettings = useCallback(() => {
    switch (options.quality) {
      case 'high':
        return { width: 1920, height: 1080, videoBitrate: 8000000, audioBitrate: 128000 };
      case 'medium':
        return { width: 1280, height: 720, videoBitrate: 4000000, audioBitrate: 96000 };
      case 'low':
        return { width: 854, height: 480, videoBitrate: 2000000, audioBitrate: 64000 };
      default:
        return { width: 1920, height: 1080, videoBitrate: 8000000, audioBitrate: 128000 };
    }
  }, [options.quality]);

  // Find Three.js canvas
  const findThreeJSCanvas = useCallback((): HTMLCanvasElement | null => {
    const selectors = [
      'canvas[data-engine*="three"]',
      'canvas[data-engine*="r3f"]',
      'div[class*="r3f"] canvas',
      'div[class*="three"] canvas',
      'canvas[width][height]'
    ];

    for (const selector of selectors) {
      const canvas = document.querySelector(selector) as HTMLCanvasElement;
      if (canvas && canvas.width > 0 && canvas.height > 0) {
        console.log('✅ Found Three.js canvas:', {
          selector,
          width: canvas.width,
          height: canvas.height,
          classList: Array.from(canvas.classList)
        });
        return canvas;
      }
    }

    // Fallback: look for any canvas that looks like it's rendering
    const allCanvases = document.querySelectorAll('canvas');
    for (const canvas of allCanvases) {
      if (canvas.width > 100 && canvas.height > 100) {
        console.log('✅ Found fallback canvas:', {
          width: canvas.width,
          height: canvas.height,
          id: canvas.id,
          className: canvas.className
        });
        return canvas;
      }
    }

    console.error('❌ No suitable canvas found');
    return null;
  }, []);

  // Setup audio context and connect audio sources
  const setupAudioCapture = useCallback(async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      if (!audioDestinationRef.current) {
        audioDestinationRef.current = audioContextRef.current.createMediaStreamDestination();
      }

      const audioContext = audioContextRef.current;
      const destination = audioDestinationRef.current;

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      let connectedAudio = false;

      // Connect SceneEngine audio refs first (they are the primary audio sources)
      if (bgmRef.current) {
        try {
          if (!(bgmRef.current as any).__recordingConnected) {
            const source = audioContext.createMediaElementSource(bgmRef.current);
            const gainNode = audioContext.createGain();
            gainNode.gain.value = 0.3; // BGM volume
            
            source.connect(gainNode);
            gainNode.connect(destination);
            gainNode.connect(audioContext.destination);
            
            (bgmRef.current as any).__recordingConnected = true;
            console.log('✅ Connected SceneEngine BGM audio');
            connectedAudio = true;
          }
        } catch (error) {
          console.warn('⚠️ Failed to connect SceneEngine BGM:', error);
        }
      }

      if (audioRef.current) {
        try {
          if (!(audioRef.current as any).__recordingConnected) {
            const source = audioContext.createMediaElementSource(audioRef.current);
            const gainNode = audioContext.createGain();
            gainNode.gain.value = 0.8; // TTS volume
            
            source.connect(gainNode);
            gainNode.connect(destination);
            gainNode.connect(audioContext.destination);
            
            (audioRef.current as any).__recordingConnected = true;
            console.log('✅ Connected SceneEngine TTS audio');
            connectedAudio = true;
          }
        } catch (error) {
          console.warn('⚠️ Failed to connect SceneEngine TTS:', error);
        }
      }

      // Find and connect ALL other audio elements (BGM + TTS)
      const audioElements = document.querySelectorAll('audio');
      
      for (const audio of audioElements) {
        try {
          // Skip if audio element is already connected to avoid duplicate connections
          if ((audio as any).__recordingConnected) continue;

          const source = audioContext.createMediaElementSource(audio);
          const gainNode = audioContext.createGain();
          
          // Set appropriate volume levels
          if (audio.src.includes('musicbg.mp3') || audio.src.includes('/audio/')) {
            gainNode.gain.value = 0.3; // Lower volume for background music
            console.log('✅ Connected BGM audio:', audio.src);
          } else {
            gainNode.gain.value = 0.8; // Higher volume for TTS/speech
            console.log('✅ Connected TTS audio:', audio.src);
          }

          source.connect(gainNode);
          gainNode.connect(destination);
          gainNode.connect(audioContext.destination); // Also play through speakers

          // Mark as connected
          (audio as any).__recordingConnected = true;
          connectedAudio = true;

        } catch (error) {
          console.warn('⚠️ Failed to connect audio source:', audio.src, error);
        }
      }

      // If no audio found, create background music
      if (!connectedAudio) {
        const audio = new Audio('/audio/musicbg.mp3');
        audio.volume = 0.3;
        audio.loop = true;
        
        try {
          await audio.play();
          const source = audioContext.createMediaElementSource(audio);
          const gainNode = audioContext.createGain();
          gainNode.gain.value = 0.3;

          source.connect(gainNode);
          gainNode.connect(destination);
          gainNode.connect(audioContext.destination);

          console.log('✅ Created and connected new BGM audio');
          connectedAudio = true;
        } catch (error) {
          console.warn('⚠️ Failed to create new BGM audio:', error);
        }
      }

      // Set up a periodic check for new audio elements (for dynamically created TTS audio)
      const checkForNewAudio = setInterval(() => {
        const newAudioElements = document.querySelectorAll('audio:not([data-recording-connected])');
        
        for (const audio of newAudioElements) {
          try {
            if ((audio as any).__recordingConnected) continue;

            const source = audioContext.createMediaElementSource(audio);
            const gainNode = audioContext.createGain();
            gainNode.gain.value = 0.8; // TTS audio

            source.connect(gainNode);
            gainNode.connect(destination);
            gainNode.connect(audioContext.destination);

            (audio as any).__recordingConnected = true;
            console.log('✅ Connected new TTS audio:', audio.src);

          } catch (error) {
            console.warn('⚠️ Failed to connect new audio:', error);
          }
        }
      }, 1000);

      // Clean up interval after 30 seconds
      setTimeout(() => clearInterval(checkForNewAudio), 30000);

      return destination.stream;
    } catch (error) {
      console.error('❌ Audio setup failed:', error);
      return null;
    }
  }, [audioRef, bgmRef]);

  // Create composite canvas
  const createCompositeCanvas = useCallback((sourceCanvas: HTMLCanvasElement) => {
    const settings = getQualitySettings();
    const canvas = document.createElement('canvas');
    canvas.width = settings.width;
    canvas.height = settings.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    compositeCanvasRef.current = canvas;

    // Draw function
    const drawFrame = () => {
      if (!ctx || !sourceCanvas) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw source canvas (3D scene)
      ctx.drawImage(sourceCanvas, 0, 0, canvas.width, canvas.height);

      // Draw UI overlays
      drawUIOverlays(ctx, canvas.width, canvas.height);

      // Draw recording indicator
      drawRecordingIndicator(ctx, canvas.width, canvas.height);
    };

    return { canvas, drawFrame };
  }, [getQualitySettings]);

  // Draw UI overlays
  const drawUIOverlays = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save();

    // Draw chat overlay
    const chatContainer = document.querySelector('.live-chat, [class*="chat"], [class*="LiveChat"]');
    if (chatContainer) {
      const rect = chatContainer.getBoundingClientRect();
      const chatWidth = Math.min(rect.width, width * 0.35);
      const chatHeight = Math.min(rect.height, height * 0.8);
      const chatX = width - chatWidth - 15;
      const chatY = 15;

      // Chat background with gradient
      const gradient = ctx.createLinearGradient(chatX, chatY, chatX, chatY + chatHeight);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
      ctx.fillStyle = gradient;
      ctx.fillRect(chatX, chatY, chatWidth, chatHeight);

      // Chat border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(chatX, chatY, chatWidth, chatHeight);

      // Chat title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px Arial';
      ctx.fillText('💬 Live Chat', chatX + 12, chatY + 28);

      // Chat messages - get more specific message elements
      const messages = chatContainer.querySelectorAll('.message, [class*="message"], .chat-message, [class*="chat-message"], div[class*="Message"]');
      ctx.font = '14px Arial';
      
      let messageY = chatY + 55;
      const maxMessages = Math.floor((chatHeight - 70) / 22);
      
      // Show most recent messages
      const recentMessages = Array.from(messages).slice(-maxMessages);
      
      recentMessages.forEach((msg, index) => {
        const text = msg.textContent || '';
        const username = msg.querySelector('.username, [class*="username"], .name, [class*="name"]')?.textContent || '';
        
        if (text.trim()) {
          ctx.fillStyle = '#ffdd44';
          ctx.font = 'bold 12px Arial';
          if (username) {
            ctx.fillText(username + ':', chatX + 12, messageY);
            messageY += 15;
          }
          
          ctx.fillStyle = '#ffffff';
          ctx.font = '13px Arial';
          const maxChars = Math.floor((chatWidth - 24) / 8);
          const wrappedText = text.length > maxChars ? text.substring(0, maxChars) + '...' : text;
          ctx.fillText(wrappedText, chatX + 12, messageY);
          messageY += 22;
        }
      });
    }

    // Draw AI response overlay - use current response from SceneEngineContext
    const aiResponse = document.querySelector('.ai-response, [class*="ai-response"], [class*="AIResponse"], [class*="response"]');
    const responseText = currentResponse?.text || aiResponse?.textContent || '';
    
    if (responseText) {
      const maxWidth = width * 0.7;
      const responseHeight = 120;
      const responseX = 15;
      const responseY = height - responseHeight - 15;

      // Response background with gradient
      const gradient = ctx.createLinearGradient(responseX, responseY, responseX, responseY + responseHeight);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
      gradient.addColorStop(1, 'rgba(20, 20, 20, 0.85)');
      ctx.fillStyle = gradient;
      ctx.fillRect(responseX, responseY, maxWidth, responseHeight);

      // Response border
      ctx.strokeStyle = 'rgba(100, 200, 255, 0.6)';
      ctx.lineWidth = 3;
      ctx.strokeRect(responseX, responseY, maxWidth, responseHeight);

      // AI icon and title
      ctx.fillStyle = '#00aaff';
      ctx.font = 'bold 18px Arial';
      const agentName = currentResponse?.agentId || 'AI';
      ctx.fillText(`🤖 ${agentName}`, responseX + 15, responseY + 28);

      // Response text with word wrapping
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Arial';
      
      const maxCharsPerLine = Math.floor((maxWidth - 30) / 9);
      const lines = [];
      let currentLine = '';
      const words = responseText.split(' ');
      
      for (const word of words) {
        if ((currentLine + word).length <= maxCharsPerLine) {
          currentLine += (currentLine ? ' ' : '') + word;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) lines.push(currentLine);
      
      // Draw up to 3 lines
      lines.slice(0, 3).forEach((line, index) => {
        ctx.fillText(line, responseX + 15, responseY + 55 + (index * 22));
      });
    }

    ctx.restore();
  }, [currentResponse]);

  // Draw recording indicator
  const drawRecordingIndicator = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const time = Date.now();
    const pulse = Math.sin(time * 0.01) * 0.5 + 0.5;

    // Recording dot
    ctx.fillStyle = `rgba(255, 0, 0, ${0.7 + pulse * 0.3})`;
    ctx.beginPath();
    ctx.arc(width - 40, 40, 12, 0, Math.PI * 2);
    ctx.fill();

    // REC text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('REC', width - 70, 46);

    // Progress bar
    const progressWidth = 200;
    const progressX = width - progressWidth - 20;
    const progressY = 70;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(progressX, progressY, progressWidth, 8);
    
    ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.fillRect(progressX, progressY, progressWidth * (state.progress / 100), 8);
  }, [state.progress]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isRecording: true, error: null, progress: 0 }));
      
      // Find canvas
      const sourceCanvas = findThreeJSCanvas();
      if (!sourceCanvas) {
        throw new Error('No Three.js canvas found');
      }

      // Setup audio
      const audioStream = await setupAudioCapture();

      // Create composite canvas
      const canvasSetup = createCompositeCanvas(sourceCanvas);
      if (!canvasSetup) {
        throw new Error('Failed to create composite canvas');
      }

      const { canvas, drawFrame } = canvasSetup;

      // Get video stream
      const videoStream = canvas.captureStream(options.fps);

      // Combine video and audio streams
      let finalStream = videoStream;
      if (audioStream) {
        finalStream = new MediaStream([
          ...videoStream.getVideoTracks(),
          ...audioStream.getAudioTracks()
        ]);
      }

      // Setup MediaRecorder
      const settings = getQualitySettings();
      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8,opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }
      }

      const mediaRecorder = new MediaRecorder(finalStream, {
        mimeType,
        videoBitsPerSecond: settings.videoBitrate,
        audioBitsPerSecond: settings.audioBitrate
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      startTimeRef.current = Date.now();

      // MediaRecorder events
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setState(prev => ({ 
          ...prev, 
          isRecording: false,
          lastRecordingBlob: blob,
          progress: 100
        }));
        
        if (options.onRecordingComplete) {
          options.onRecordingComplete(blob);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event);
        setState(prev => ({ 
          ...prev, 
          isRecording: false,
          error: 'Recording failed'
        }));
      };

      // Start recording
      mediaRecorder.start(1000);

      // Animation loop
      const animate = () => {
        if (mediaRecorder.state === 'recording') {
          drawFrame();
          
          // Update progress
          const elapsed = Date.now() - startTimeRef.current;
          const progress = Math.min((elapsed / (options.duration * 1000)) * 100, 100);
          setState(prev => ({ ...prev, progress }));
          
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      };
      animate();

      // Auto-stop after duration
      recordingTimeoutRef.current = setTimeout(() => {
        stopRecording();
      }, options.duration * 1000);

      console.log('🎬 Canvas recording started');

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
    }
  }, [options, findThreeJSCanvas, setupAudioCapture, createCompositeCanvas, getQualitySettings]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
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
      a.download = `bor-canvas-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
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
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopRecording]);

  return {
    state,
    startRecording,
    stopRecording,
    downloadRecording,
    isRecording: state.isRecording,
    error: state.error,
    progress: state.progress,
    lastRecordingBlob: state.lastRecordingBlob
  };
};