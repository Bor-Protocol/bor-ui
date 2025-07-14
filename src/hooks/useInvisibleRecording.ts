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
  const conversionInProgressRef = useRef<boolean>(false);
  const lastRecordingStartTimeRef = useRef<number>(0);

  const log = useCallback((message: string) => {
    console.log(`🎬 Auto Recording: ${message}`);
  }, []);

  const downloadRecording = useCallback((blob: Blob, format: 'webm' | 'mp4' = 'mp4') => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auto-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    const sizeInMB = (blob.size / (1024 * 1024)).toFixed(2);
    log(`💾 Recording downloaded: ${sizeInMB} MB - ${a.download}`);
  }, [log]);

  const convertWebMToMP4 = useCallback(async (webmBlob: Blob) => {
    // Prevent multiple conversions
    if (conversionInProgressRef.current) {
      log('⚠️ Conversion already in progress, skipping...');
      return;
    }

    try {
      conversionInProgressRef.current = true;
      log('🔄 Starting WebM to MP4 conversion...');
      
      // Check if we can record MP4 directly from canvas first
      const mp4MimeTypes = ['video/mp4', 'video/mp4;codecs=h264'];
      let mp4MimeType = null;
      
      for (const mimeType of mp4MimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          mp4MimeType = mimeType;
          break;
        }
      }
      
      if (!mp4MimeType) {
        throw new Error('MP4 recording not supported for conversion');
      }
      
      // Create a video element to load the WebM
      const video = document.createElement('video');
      const videoUrl = URL.createObjectURL(webmBlob);
      video.src = videoUrl;
      video.muted = true;
      video.playsInline = true;
      
      // Wait for the video to load with better duration handling
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Video load timeout')), 15000);
        
        const checkVideoReady = () => {
          log(`📹 Video state: ${video.readyState}, duration: ${video.duration}, dimensions: ${video.videoWidth}x${video.videoHeight}`);
          
          // Check if we have valid dimensions at least
          if (!video.videoWidth || !video.videoHeight) {
            return false; // Not ready yet
          }
          
          // For duration, we'll be more flexible
          if (video.duration && isFinite(video.duration) && video.duration > 0) {
            log(`✅ Video fully loaded with valid duration: ${video.duration}s`);
            return true;
          }
          
          // If duration is invalid but we have dimensions, we can still try
          if (video.readyState >= 3) { // HAVE_FUTURE_DATA or higher
            log(`⚠️ Video loaded but duration is ${video.duration}, proceeding anyway...`);
            return true;
          }
          
          return false;
        };
        
        video.onloadeddata = () => {
          if (checkVideoReady()) {
            clearTimeout(timeout);
            resolve(undefined);
          }
        };
        
        video.oncanplay = () => {
          if (checkVideoReady()) {
            clearTimeout(timeout);
            resolve(undefined);
          }
        };
        
        video.oncanplaythrough = () => {
          clearTimeout(timeout);
          log(`✅ Video can play through completely`);
          resolve(undefined);
        };
        
        video.onerror = (e) => {
          clearTimeout(timeout);
          reject(new Error(`Failed to load video: ${e}`));
        };
        
        // Try to load the video
        video.load();
      });
      
      // Create a canvas and context
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');
      
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      
      log(`📐 Converting video: ${canvas.width}x${canvas.height}, duration: ${video.duration}s`);
      
      // Create MP4 recorder
      const stream = canvas.captureStream(30);
      log(`🎥 Canvas stream created: ${stream.getVideoTracks().length} video tracks`);
      
      // Check if stream has active video tracks
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        log(`📺 Video track state: ${videoTrack.readyState}, enabled: ${videoTrack.enabled}`);
      } else {
        throw new Error('No video track in canvas stream');
      }
      
      const recorder = new MediaRecorder(stream, { mimeType: mp4MimeType });
      const chunks: Blob[] = [];
      
      log(`🎬 MediaRecorder created with ${mp4MimeType}`);
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
          log(`📦 MP4 chunk received: ${(event.data.size / 1024).toFixed(1)} KB`);
        } else {
          log('⚠️ Received empty MP4 chunk');
        }
      };
      
      recorder.onstop = () => {
        try {
          log(`🔍 MP4 conversion stopped. Chunks collected: ${chunks.length}`);
          
          if (chunks.length === 0) {
            log('❌ No data chunks collected for MP4');
            return;
          }
          
          const mp4Blob = new Blob(chunks, { type: 'video/mp4' });
          const sizeInMB = (mp4Blob.size / (1024 * 1024)).toFixed(2);
          
          if (mp4Blob.size === 0) {
            log('❌ MP4 blob is empty (0 bytes)');
            return;
          }
          
          // Create unique filename to avoid conflicts
          const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
          const url = URL.createObjectURL(mp4Blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `auto-recording-${timestamp}-converted.mp4`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          URL.revokeObjectURL(videoUrl);
          
          log(`✅ MP4 conversion completed: ${sizeInMB} MB - ${a.download}`);
        } catch (err) {
          log(`❌ MP4 download failed: ${err}`);
        } finally {
          conversionInProgressRef.current = false;
        }
      };
      
      recorder.onerror = (event) => {
        log(`❌ MP4 recorder error: ${event.error}`);
        URL.revokeObjectURL(videoUrl);
        conversionInProgressRef.current = false;
      };
      
      // Start recording with specific timeslice for better data collection
      recorder.start(100); // Request data every 100ms
      log('🎬 MP4 recorder started with 100ms timeslice');
      
      video.currentTime = 0;
      await video.play();
      log('📹 Video playback started');
      
      // Wait for recorder to be ready before starting video
      await new Promise(resolve => {
        if (recorder.state === 'recording') {
          resolve(undefined);
        } else {
          recorder.addEventListener('start', () => resolve(undefined), { once: true });
        }
      });
      
      log('🎬 Recorder ready, starting video playback...');
      
      // Draw initial frame to ensure something is captured
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Set up frame drawing with consistent timing
      let frameCount = 0;
      const targetFPS = 30;
      const frameDuration = 1000 / targetFPS;
      let lastFrameTime = performance.now();
      
      const drawFrame = () => {
        const currentTime = performance.now();
        
        if (currentTime - lastFrameTime >= frameDuration) {
          if (!video.paused && !video.ended && conversionInProgressRef.current) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            frameCount++;
            
            if (frameCount % 30 === 0) { // Log every second
              log(`🎞️ Frames captured: ${frameCount}, video time: ${video.currentTime.toFixed(1)}s`);
            }
            
            lastFrameTime = currentTime;
            requestAnimationFrame(drawFrame);
          } else {
            // Video ended or we can't detect the end
            log(`🏁 Video playback ended. Total frames: ${frameCount}`);
            
            // Clear the timeout since we're done
            clearTimeout(timeoutId);
            
            setTimeout(() => {
              if (recorder.state === 'recording') {
                recorder.stop();
              }
            }, 500); // Give a bit more time to process final frames
          }
        } else {
          requestAnimationFrame(drawFrame);
        }
      };
      
      // Start frame drawing
      requestAnimationFrame(drawFrame);
      
      // Estimate duration if not available
      let estimatedDuration = 30; // Default fallback
      
      if (video.duration && isFinite(video.duration) && video.duration > 0) {
        estimatedDuration = video.duration;
        log(`📏 Using actual video duration: ${estimatedDuration}s`);
      } else {
        // Try to estimate from WebM blob size (rough approximation)
        const blobSizeMB = webmBlob.size / (1024 * 1024);
        estimatedDuration = Math.max(blobSizeMB * 4, 10); // ~4 seconds per MB, minimum 10s
        log(`🔍 Estimating duration from blob size: ${blobSizeMB.toFixed(1)}MB → ~${estimatedDuration}s`);
      }
      
      const safetyTimeout = Math.max((estimatedDuration + 10) * 1000, 20000); // At least 20 seconds
      log(`⏱️ Setting safety timeout: ${safetyTimeout/1000}s`);
      
      const timeoutId = setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
          log(`⏰ Conversion stopped due to timeout after ${safetyTimeout/1000}s`);
        }
      }, safetyTimeout);
      
    } catch (error) {
      log(`❌ MP4 conversion failed: ${error}`);
      log('💡 WebM file is still available and compatible with most modern browsers');
      conversionInProgressRef.current = false;
    }
  }, [log]);

  const trySimpleMP4Conversion = useCallback(async (webmBlob: Blob) => {
    try {
      log('🔄 Trying simple MP4 conversion (filename change)...');
      
      // Simple approach: just change the MIME type and filename
      // This works if the browser recorded in a format that's MP4-compatible
      const mp4Blob = new Blob([webmBlob], { type: 'video/mp4' });
      
      // Test if the blob is actually valid by creating a video element
      const testVideo = document.createElement('video');
      const testUrl = URL.createObjectURL(mp4Blob);
      testVideo.src = testUrl;
      
      // Wait a bit to see if it loads
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Simple conversion test timeout'));
        }, 3000);
        
        testVideo.onloadedmetadata = () => {
          clearTimeout(timeout);
          if (testVideo.duration && isFinite(testVideo.duration)) {
            resolve(undefined);
          } else {
            reject(new Error('Invalid video after simple conversion'));
          }
        };
        
        testVideo.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Simple conversion produced invalid video'));
        };
        
        testVideo.load();
      });
      
      // If we get here, the simple conversion worked
      URL.revokeObjectURL(testUrl);
      downloadRecording(mp4Blob, 'mp4');
      log('✅ Simple MP4 conversion successful!');
      
    } catch (error) {
      log(`⚠️ Simple conversion failed: ${error}`);
      log('💡 For now, use the WebM file - it works in all modern browsers and can be converted using online tools');
      log('🔗 Online converters: cloudconvert.com, convertio.co, or any video editing software');
      log('📱 WebM plays natively in: Chrome, Firefox, Edge, Safari (newer versions)');
    }
  }, [log, downloadRecording]);

  const createSimpleMP4 = useCallback(async (webmBlob: Blob) => {
    // Prevent multiple conversions
    if (conversionInProgressRef.current) {
      log('⚠️ MP4 conversion already in progress, skipping...');
      return;
    }
    
    try {
      conversionInProgressRef.current = true;
      log('🔄 Creating MP4 version with audio support...');
      
      // Create video element for WebM source
      const video = document.createElement('video');
      const videoUrl = URL.createObjectURL(webmBlob);
      video.src = videoUrl;
      video.muted = false; // Don't mute to preserve audio
      video.playsInline = true;
      
      // Wait for video to load completely
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Video load timeout')), 10000);
        
        video.onloadedmetadata = () => {
          clearTimeout(timeout);
          log(`📹 Video loaded: ${video.videoWidth}x${video.videoHeight}, duration: ${video.duration}s`);
          resolve(undefined);
        };
        
        video.onerror = (e) => {
          clearTimeout(timeout);
          reject(new Error(`Video load failed: ${e}`));
        };
        
        video.load();
      });
      
      // Create canvas for video re-encoding
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not available');
      
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      
      // Get canvas video stream
      const canvasStream = canvas.captureStream(30);
      
      // Create audio context to capture audio from the video
      const audioContext = new AudioContext();
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      // Create media element source from video
      const audioSource = audioContext.createMediaElementSource(video);
      const destination = audioContext.createMediaStreamDestination();
      
      // Connect audio source to destination
      audioSource.connect(destination);
      audioSource.connect(audioContext.destination); // Also connect to speakers
      
      // Combine video and audio streams
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...destination.stream.getAudioTracks()
      ]);
      
      log(`🎥 Combined stream: ${combinedStream.getVideoTracks().length} video, ${combinedStream.getAudioTracks().length} audio tracks`);
      
      // Check for MP4 support with audio
      const mp4MimeTypes = [
        'video/mp4;codecs=h264,aac',
        'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
        'video/mp4'
      ];
      
      let workingMimeType = null;
      for (const mimeType of mp4MimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          workingMimeType = mimeType;
          break;
        }
      }
      
      if (!workingMimeType) {
        log('❌ No MP4 recording support available');
        URL.revokeObjectURL(videoUrl);
        audioContext.close();
        return;
      }
      
      log(`✅ Using MP4 format with audio: ${workingMimeType}`);
      
      const recorder = new MediaRecorder(combinedStream, { 
        mimeType: workingMimeType,
        videoBitsPerSecond: 2500000, // Increase for better quality
        audioBitsPerSecond: 128000
      });
      
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
          log(`📦 MP4 chunk: ${(event.data.size / 1024).toFixed(1)} KB`);
        }
      };
      
      recorder.onstop = () => {
        try {
          if (chunks.length === 0) {
            log('❌ No MP4 data collected');
            return;
          }
          
          const mp4Blob = new Blob(chunks, { type: 'video/mp4' });
          
          if (mp4Blob.size === 0) {
            log('❌ MP4 blob is empty');
            return;
          }
          
          // Download MP4 with audio
          const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
          const url = URL.createObjectURL(mp4Blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `auto-recording-${timestamp}-with-audio.mp4`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          URL.revokeObjectURL(videoUrl);
          
          const sizeInMB = (mp4Blob.size / (1024 * 1024)).toFixed(2);
          log(`✅ MP4 with audio created: ${sizeInMB} MB - ${a.download}`);
        } catch (err) {
          log(`❌ MP4 creation failed: ${err}`);
        } finally {
          audioContext.close();
        }
      };
      
      recorder.onerror = (event) => {
        log(`❌ MP4 recorder error: ${event.error}`);
        URL.revokeObjectURL(videoUrl);
        audioContext.close();
      };
      
      // Start recording
      recorder.start(200);
      log('🎬 MP4 recorder with audio started');
      
      // Play video and draw frames synchronously
      video.currentTime = 0;
      await video.play();
      
      let frameCount = 0;
      const validDuration = video.duration && isFinite(video.duration) ? video.duration : 30;
      const maxFrames = Math.min(30 * validDuration, 30 * 60); // Respect video duration, max 60s
      const startTime = Date.now();
      
      log(`🎬 Starting MP4 conversion: ${maxFrames} max frames, duration: ${validDuration}s`);
      
      const drawFrame = () => {
        const elapsed = (Date.now() - startTime) / 1000;
        
        if (!video.paused && !video.ended && frameCount < maxFrames && elapsed < validDuration + 5) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          frameCount++;
          
          if (frameCount % 60 === 0) { // Log every 2 seconds
            log(`🎞️ MP4 frames: ${frameCount}, time: ${video.currentTime.toFixed(1)}s, elapsed: ${elapsed.toFixed(1)}s`);
          }
          
          requestAnimationFrame(drawFrame);
        } else {
          log(`🏁 MP4 encoding complete. Frames: ${frameCount}, elapsed: ${elapsed.toFixed(1)}s`);
          // Stop recording after a small delay
          setTimeout(() => {
            if (recorder.state === 'recording') {
              recorder.stop();
            }
          }, 500);
        }
      };
      
      drawFrame();
      
      // Safety timeout - use fixed duration for infinite videos
      const safetyTimeout = Math.max((validDuration + 5) * 1000, 15000);
      log(`⏱️ Setting safety timeout: ${safetyTimeout/1000}s`);
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
          log(`⏰ MP4 recording stopped due to timeout after ${safetyTimeout/1000}s`);
        }
      }, safetyTimeout);
      
    } catch (error) {
      log(`❌ MP4 creation with audio failed: ${error}`);
      log('💡 WebM file is still available and includes audio');
    } finally {
      conversionInProgressRef.current = false;
    }
  }, [log]);

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
      
      // Track recording start time
      lastRecordingStartTimeRef.current = Date.now();
      
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

      // Debug: Check what formats are supported
      log('🔍 Checking browser codec support...');
      const testFormats = [
        'video/mp4;codecs=h264,aac',
        'video/mp4;codecs=avc1.42E01E,mp4a.40.2', 
        'video/mp4;codecs=h264',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm'
      ];
      
      testFormats.forEach(format => {
        const supported = MediaRecorder.isTypeSupported(format);
        log(`📋 ${format}: ${supported ? '✅ Supported' : '❌ Not supported'}`);
      });
      
      // Setup MediaRecorder with better codec fallbacks
      let mimeType = 'video/webm'; // Start with webm as it's more widely supported for recording
      
      // Try different formats in order of preference
      const formatOptions = [
        'video/webm;codecs=vp9,opus',  // Best WebM quality
        'video/webm;codecs=vp8,opus',  // Good WebM compatibility
        'video/webm',                  // Basic WebM
        'video/mp4;codecs=h264,aac',   // Try MP4 (less supported for recording)
        'video/mp4'                    // Basic MP4
      ];
      
      for (const option of formatOptions) {
        if (MediaRecorder.isTypeSupported(option)) {
          mimeType = option;
          const isMP4 = option.includes('mp4');
          log(`${isMP4 ? '🎬' : '🎞️'} Selected format: ${option}`);
          break;
        }
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
          
          // Download the recording in the native format
          if (mimeType.includes('webm')) {
            // Download WebM (works reliably)
            downloadRecording(blob, 'webm');
            log('💡 WebM file downloaded - plays in all modern browsers!');
            
            // Try to create MP4 version with audio (only if not already in progress)
            if (!conversionInProgressRef.current) {
              createSimpleMP4(blob);
            } else {
              log('⚠️ MP4 conversion skipped - already in progress');
            }
          } else {
            // Already MP4, just download
            downloadRecording(blob, 'mp4');
          }
          
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

    // Disable user interaction triggers - we only want audio-triggered recording
    const handleUserInteraction = () => {
      lastUserInteractionRef.current = Date.now();
      log(`👤 User interaction detected (audio-only mode - no recording trigger)`);
    };

    // Listen for user interaction events for timing tracking only
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
      
      // Reset conversion flag
      conversionInProgressRef.current = false;
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
    
    // Reset conversion flag when manually stopping
    conversionInProgressRef.current = false;
    
    isRecordingRef.current = false;
  }, [log]);

  // Single trigger: Start recording when audio starts (most precise timing)
  useEffect(() => {
    // Only trigger on audio state change from false to true (not continuous playing)
    const audioJustStarted = audioData.isPlaying && !lastAudioPlayingStateRef.current;
    
    // Relaxed safety checks - let's see all audio events first
    const timeSinceLastRecording = Date.now() - lastRecordingStartTimeRef.current;
    
    // Debug logging for all audio state changes
    if (audioJustStarted) {
      log(`🎵 Audio state changed to playing - Checking conditions:`);
      log(`  - audioData.amplitude: ${audioData.amplitude.toFixed(3)}`);
      log(`  - streamRef.current: ${!!streamRef.current}`);
      log(`  - isRecordingRef.current: ${isRecordingRef.current}`);
      log(`  - recordingCooldownRef.current: ${recordingCooldownRef.current}`);
      log(`  - initializationCompleteRef.current: ${initializationCompleteRef.current}`);
      log(`  - timeSinceLastRecording: ${(timeSinceLastRecording/1000).toFixed(1)}s`);
    }
    
    // Simplified trigger conditions - remove amplitude check for now
    if (audioJustStarted && 
        streamRef.current && 
        !isRecordingRef.current &&
        !recordingCooldownRef.current &&
        initializationCompleteRef.current &&
        timeSinceLastRecording > 10000) { // Reduced to 10 seconds
      
      log(`🎯 Audio just started with valid content - Starting recording immediately`);
      log(`📊 Audio amplitude: ${audioData.amplitude.toFixed(3)}`);
      
      // Clear any pending timeouts
      if (preRecordingTimeoutRef.current) {
        clearTimeout(preRecordingTimeoutRef.current);
        preRecordingTimeoutRef.current = null;
      }
      
      // Start recording immediately when audio starts
      startRecording();
    } else if (audioJustStarted && !streamRef.current) {
      log(`⚠️ Audio started but no screen sharing stream available`);
    } else if (audioJustStarted && recordingCooldownRef.current) {
      log(`⚠️ Audio started but recording is in cooldown period`);
    } else if (audioJustStarted && isRecordingRef.current) {
      log(`⚠️ Audio started but recording is already in progress`);
    } else if (audioJustStarted && !initializationCompleteRef.current) {
      log(`⚠️ Audio started but initialization not complete`);
    } else if (audioJustStarted && timeSinceLastRecording <= 10000) {
      log(`⚠️ Audio started but too soon after last recording (${(timeSinceLastRecording/1000).toFixed(1)}s ago)`);
    }
    
    // Update the last audio state
    lastAudioPlayingStateRef.current = audioData.isPlaying;
  }, [audioData.isPlaying, audioData.amplitude, log]);

  // Monitor when message popup appears and disappears
  useEffect(() => {
    const responseVisible = currentResponse !== null;
    const responseJustAppeared = responseVisible && !lastResponseVisibleRef.current;
    const responseJustDisappeared = lastResponseVisibleRef.current && !responseVisible;
    
    // Debug logging for message popup state
    if (responseJustAppeared) {
      log(`📱 Message popup appeared - Response: ${currentResponse?.text?.substring(0, 50)}...`);
      
      // Fallback recording trigger if audio detection failed
      if (!isRecordingRef.current && 
          !recordingCooldownRef.current && 
          streamRef.current && 
          initializationCompleteRef.current) {
        log(`🔄 Fallback: Starting recording from message popup (audio detection may have failed)`);
        startRecording();
      }
    }
    
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