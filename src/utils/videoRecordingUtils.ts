export interface RecordingConfig {
  width: number;
  height: number;
  fps: number;
  videoBitrate: number;
  audioBitrate: number;
  format: 'webm' | 'mp4';
}

export const RECORDING_PRESETS = {
  high: {
    width: 1920,
    height: 1080,
    fps: 30,
    videoBitrate: 8000000,
    audioBitrate: 128000,
    format: 'webm' as const
  },
  medium: {
    width: 1280,
    height: 720,
    fps: 30,
    videoBitrate: 4000000,
    audioBitrate: 96000,
    format: 'webm' as const
  },
  low: {
    width: 854,
    height: 480,
    fps: 30,
    videoBitrate: 2000000,
    audioBitrate: 64000,
    format: 'webm' as const
  }
} as const;

export const findThreeJSCanvas = (): HTMLCanvasElement | null => {
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
      console.log('✅ Found Three.js canvas:', selector);
      return canvas;
    }
  }

  console.warn('❌ No Three.js canvas found');
  return null;
};

export const createCompositeCanvas = (
  sourceCanvas: HTMLCanvasElement,
  config: RecordingConfig
): { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D } | null => {
  const canvas = document.createElement('canvas');
  canvas.width = config.width;
  canvas.height = config.height;
  
  const context = canvas.getContext('2d');
  if (!context) return null;

  // Configure canvas for optimal recording
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  return { canvas, context };
};

export const drawUIOverlay = (
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number
) => {
  // Save the current state
  ctx.save();

  // Draw chat overlay
  const chatContainer = document.querySelector('.live-chat, [class*="chat"]');
  if (chatContainer) {
    const rect = chatContainer.getBoundingClientRect();
    const chatX = canvasWidth - rect.width - 20;
    const chatY = 20;
    
    // Chat background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(chatX, chatY, rect.width, rect.height);
    
    // Chat border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(chatX, chatY, rect.width, rect.height);
    
    // Chat messages
    const messages = chatContainer.querySelectorAll('.message, [class*="message"]');
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    
    messages.forEach((msg, index) => {
      const text = msg.textContent || '';
      const y = chatY + 20 + (index * 20);
      ctx.fillText(text.substring(0, 40), chatX + 10, y);
    });
  }

  // Draw AI response overlay
  const aiResponse = document.querySelector('.ai-response, [class*="ai-response"]');
  if (aiResponse) {
    const rect = aiResponse.getBoundingClientRect();
    const responseX = 20;
    const responseY = canvasHeight - rect.height - 20;
    
    // Response background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(responseX, responseY, rect.width, rect.height);
    
    // Response border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(responseX, responseY, rect.width, rect.height);
    
    // Response text
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    const text = aiResponse.textContent || '';
    ctx.fillText(text.substring(0, 80), responseX + 10, responseY + 25);
  }

  // Draw recording indicator
  const time = Date.now();
  const pulse = Math.sin(time * 0.01) * 0.5 + 0.5;
  
  ctx.fillStyle = `rgba(255, 0, 0, ${0.7 + pulse * 0.3})`;
  ctx.beginPath();
  ctx.arc(canvasWidth - 30, 30, 8, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = 'white';
  ctx.font = '12px Arial';
  ctx.fillText('REC', canvasWidth - 50, 36);

  // Restore the state
  ctx.restore();
};

export const setupAudioMixing = (audioContext: AudioContext): MediaStreamAudioDestinationNode | null => {
  try {
    const destination = audioContext.createMediaStreamDestination();
    
    // Mix background music
    const bgmElements = document.querySelectorAll('audio[src*="musicbg"], audio[src*="bgm"]');
    bgmElements.forEach(audio => {
      if (audio instanceof HTMLAudioElement && !audio.paused) {
        const source = audioContext.createMediaElementSource(audio);
        const gain = audioContext.createGain();
        gain.gain.value = 0.3;
        source.connect(gain).connect(destination);
      }
    });

    // Mix TTS audio
    const ttsElements = document.querySelectorAll('audio[src*="tts"], audio[src*="audio"]');
    ttsElements.forEach(audio => {
      if (audio instanceof HTMLAudioElement && !audio.paused) {
        const source = audioContext.createMediaElementSource(audio);
        const gain = audioContext.createGain();
        gain.gain.value = 0.8;
        source.connect(gain).connect(destination);
      }
    });

    return destination;
  } catch (error) {
    console.error('Audio mixing setup failed:', error);
    return null;
  }
};

export const createVideoBlob = (chunks: Blob[], mimeType: string): Blob => {
  return new Blob(chunks, { type: mimeType });
};

export const downloadVideo = (blob: Blob, filename?: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `bor-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
  
  // Ensure the element is in the DOM for Firefox
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
};

export const convertWebMToMp4 = async (webmBlob: Blob): Promise<Blob> => {
  // Note: This would require a WebAssembly-based solution like FFmpeg.wasm
  // For now, we'll return the original blob
  // In a real implementation, you'd use something like:
  // const ffmpeg = createFFmpeg({ log: true });
  // await ffmpeg.load();
  // ... conversion logic
  
  console.warn('MP4 conversion not implemented - returning WebM');
  return webmBlob;
};