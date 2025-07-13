import { useRef, useCallback, useEffect } from 'react';
import { useSceneEngine } from '../contexts/SceneEngineContext';

export const useInvisibleRecording = () => {
  const { currentResponse, audioRef, bgmRef, audioData } = useSceneEngine();
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isRecordingRef = useRef<boolean>(false);
  const lastResponseIdRef = useRef<string | null>(null);
  const preRecordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUserInteractionRef = useRef<number>(0);
  const permissionRequestedRef = useRef<boolean>(false);
  const downloadedRef = useRef<boolean>(false);
  const recordingInstanceIdRef = useRef<string | null>(null);
  const initializationCompleteRef = useRef<boolean>(false);
  const lastAudioPlayingStateRef = useRef<boolean>(false);
  const recordingCooldownRef = useRef<boolean>(false);
  const messageDisappearTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastResponseVisibleRef = useRef<boolean>(false);

  const log = useCallback((message: string) => {
    console.log(`🎬 Auto Recording: ${message}`);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      if (!streamRef.current) {
        log('❌ No screen sharing stream available');
        return;
      }

      if (isRecordingRef.current) {
        log('⚠️ Recording already in progress - ignoring duplicate request');
        return;
      }

      if (recordingCooldownRef.current) {
        log('⚠️ Recording in cooldown period - ignoring request');
        return;
      }

      // Create unique recording instance ID to prevent duplicates
      const instanceId = `recording-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      recordingInstanceIdRef.current = instanceId;
      
      isRecordingRef.current = true;
      recordingCooldownRef.current = true; // Set cooldown to prevent immediate re-recording
      downloadedRef.current = false; // Reset download flag for new recording
      log(`🎬 Starting automatic recording (25 seconds) - Instance: ${instanceId}`);

      const videoStream = streamRef.current;
      log(`📺 Using stream: ${videoStream.getVideoTracks().length} video, ${videoStream.getAudioTracks().length} audio tracks`);

      // Setup additional audio
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
            
            log('🎵 Background music connected');
            audioConnected = true;
          } catch (error) {
            log(`⚠️ BGM connection failed: ${error}`);
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
            
            log('🗣️ TTS audio connected');
            audioConnected = true;
          } catch (error) {
            log(`⚠️ TTS connection failed: ${error}`);
          }
        }

        if (audioConnected) {
          const allAudioTracks = [
            ...videoStream.getAudioTracks(),
            ...destination.stream.getAudioTracks()
          ];
          
          finalStream = new MediaStream([
            ...videoStream.getVideoTracks(),
            ...allAudioTracks
          ]);
          
          log(`🔊 Final stream: ${finalStream.getVideoTracks().length} video, ${finalStream.getAudioTracks().length} audio tracks`);
        }
        
      } catch (error) {
        log(`⚠️ Audio setup failed: ${error}`);
      }

      // Setup MediaRecorder
      let mimeType = 'video/webm;codecs=vp8,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
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
          log(`📦 Data chunk received: ${(event.data.size / 1024).toFixed(1)} KB`);
        }
      };

      mediaRecorder.onstop = () => {
        const currentInstanceId = recordingInstanceIdRef.current;
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const sizeInMB = (blob.size / (1024 * 1024)).toFixed(2);
        log(`✅ Recording completed: ${sizeInMB} MB - Instance: ${currentInstanceId}`);
        
        isRecordingRef.current = false;
        
        // Auto-download only once per instance
        if (!downloadedRef.current && currentInstanceId === recordingInstanceIdRef.current) {
          downloadedRef.current = true;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `auto-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          log(`💾 Recording auto-downloaded: ${a.download} - Instance: ${currentInstanceId}`);
          
          // Clear instance ID after successful download
          recordingInstanceIdRef.current = null;
          
          // Set cooldown period to prevent immediate re-recording (10 seconds)
          setTimeout(() => {
            recordingCooldownRef.current = false;
            log('🔄 Recording cooldown period ended - Ready for next recording');
          }, 10000);
        } else if (downloadedRef.current) {
          log(`⚠️ Download skipped - already downloaded for this recording`);
        } else if (currentInstanceId !== recordingInstanceIdRef.current) {
          log(`⚠️ Download skipped - instance ID mismatch`);
        }
      };

      mediaRecorder.onerror = (event) => {
        log(`❌ Recording error: ${event.error}`);
        isRecordingRef.current = false;
      };

      // Start recording
      mediaRecorder.start(1000);
      log('🔴 Recording started');

      // Progress logging every 10 seconds
      const startTime = Date.now();
      const logProgress = () => {
        if (mediaRecorder.state === 'recording') {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          const remaining = Math.max(0, 25 - elapsed);
          log(`⏱️ Recording progress: ${elapsed}s elapsed, ${remaining}s remaining`);
          
          if (remaining > 0) {
            setTimeout(logProgress, 10000);
          }
        }
      };
      setTimeout(logProgress, 10000);

      // Auto-stop after 25 seconds (failsafe)
      timeoutRef.current = setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          log('⏹️ Recording stopped automatically after 25 seconds (failsafe)');
        }
      }, 25000);

    } catch (error) {
      log(`❌ Recording failed: ${error}`);
      isRecordingRef.current = false;
    }
  }, [bgmRef, audioRef, log]);

  // Initialize screen sharing permission on component mount
  useEffect(() => {
    const initializePermission = async () => {
      // Only request permission once globally
      if (permissionRequestedRef.current || streamRef.current || initializationCompleteRef.current) {
        return;
      }
      
      try {
        permissionRequestedRef.current = true;
        initializationCompleteRef.current = true;
        log('Requesting screen sharing permission...');
        
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 }
          },
          audio: true,
          preferCurrentTab: true
        });
        
        streamRef.current = stream;
        log('✅ Screen sharing permission granted - Ready for automatic recording');
        
      } catch (error) {
        log(`❌ Screen sharing permission denied: ${error}`);
        permissionRequestedRef.current = false;
        initializationCompleteRef.current = false;
      }
    };

    // Monitor user interactions to predict AI responses
    const handleUserInteraction = () => {
      lastUserInteractionRef.current = Date.now();
      
      // Clear any existing timeout
      if (preRecordingTimeoutRef.current) {
        clearTimeout(preRecordingTimeoutRef.current);
      }
      
      // Start pre-recording after user interaction with shorter delay for better timing
      if (streamRef.current && !isRecordingRef.current && !recordingCooldownRef.current) {
        log(`👤 User interaction detected - Starting pre-recording in 2 seconds`);
        
        preRecordingTimeoutRef.current = setTimeout(() => {
          if (!isRecordingRef.current && !recordingCooldownRef.current) {
            log(`⏰ Pre-recording trigger activated`);
            startRecording();
          }
        }, 2000); // Reduced from 5 seconds to 2 seconds for better timing
      } else if (recordingCooldownRef.current) {
        log(`👤 User interaction detected but recording is in cooldown period`);
      }
    };

    // Listen for various user interaction events
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);

    initializePermission();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Clean up event listeners
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      
      if (preRecordingTimeoutRef.current) {
        clearTimeout(preRecordingTimeoutRef.current);
      }
      
      if (messageDisappearTimeoutRef.current) {
        clearTimeout(messageDisappearTimeoutRef.current);
      }
    };
  }, [log]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      log('⏹️ Recording stopped manually');
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (messageDisappearTimeoutRef.current) {
      clearTimeout(messageDisappearTimeoutRef.current);
      messageDisappearTimeoutRef.current = null;
    }
    
    isRecordingRef.current = false;
  }, [log]);

  // Priority trigger: Start recording when audio starts (most precise timing)
  useEffect(() => {
    // Only trigger on audio state change from false to true (not continuous playing)
    const audioJustStarted = audioData.isPlaying && !lastAudioPlayingStateRef.current;
    
    if (audioJustStarted && 
        streamRef.current && 
        !isRecordingRef.current &&
        !recordingCooldownRef.current &&
        initializationCompleteRef.current) {
      
      log(`🎯 Audio just started - Starting recording immediately (perfect timing)`);
      
      // Clear any pending pre-recording timeout since we have perfect timing
      if (preRecordingTimeoutRef.current) {
        clearTimeout(preRecordingTimeoutRef.current);
        preRecordingTimeoutRef.current = null;
      }
      
      // Start recording immediately when audio starts
      startRecording();
    }
    
    // Update the last audio state
    lastAudioPlayingStateRef.current = audioData.isPlaying;
  }, [audioData.isPlaying, log]);

  // Backup trigger: AI response detection (if audio trigger missed)
  useEffect(() => {
    if (currentResponse && 
        streamRef.current && 
        !isRecordingRef.current && 
        !recordingCooldownRef.current &&
        currentResponse.id !== lastResponseIdRef.current &&
        initializationCompleteRef.current) {
      
      log(`🎯 AI response detected (${currentResponse.id}) - Backup trigger`);
      lastResponseIdRef.current = currentResponse.id;
      
      // Clear pre-recording timeout if response detected
      if (preRecordingTimeoutRef.current) {
        clearTimeout(preRecordingTimeoutRef.current);
        preRecordingTimeoutRef.current = null;
      }
      
      // Only start if not already recording and not in cooldown
      if (!isRecordingRef.current && !recordingCooldownRef.current) {
        startRecording();
      }
    }
  }, [currentResponse, log]);

  // Monitor when message popup disappears and stop recording 2 seconds later
  useEffect(() => {
    const responseVisible = currentResponse !== null;
    const responseJustDisappeared = lastResponseVisibleRef.current && !responseVisible;
    
    if (responseJustDisappeared && isRecordingRef.current) {
      log(`📱 Message popup disappeared - Stopping recording in 2 seconds`);
      
      // Clear any existing timeout
      if (messageDisappearTimeoutRef.current) {
        clearTimeout(messageDisappearTimeoutRef.current);
      }
      
      // Stop recording 2 seconds after message disappears
      messageDisappearTimeoutRef.current = setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
          log('⏹️ Recording stopped 2 seconds after message popup disappeared');
          
          // Clear the main timeout since we stopped early
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
        }
      }, 2000);
    }
    
    // Update the last visible state
    lastResponseVisibleRef.current = responseVisible;
  }, [currentResponse, log]);

  return {
    startRecording,
    stopRecording,
    isRecording: isRecordingRef.current
  };
};