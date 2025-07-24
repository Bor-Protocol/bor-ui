import React, { useEffect } from 'react';
import { Button } from '../ui/button';

interface GoogleAuthButtonProps {
  onSuccess: (googleUser: any) => void;
  onError: (error: any) => void;
  mode: 'signin' | 'signup';
}

// Google Identity Services types
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id';

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({ onSuccess, onError, mode }) => {
  const buttonRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Google Identity Services script
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleAuth;
      document.head.appendChild(script);
    } else {
      initializeGoogleAuth();
    }
  }, []);

  const initializeGoogleAuth = () => {
    if (!window.google || !GOOGLE_CLIENT_ID) {
      console.warn('Google Identity Services not loaded or Client ID not configured');
      return;
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    // Render the Google Sign-In button
    if (buttonRef.current) {
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        width: '100%',
        text: mode === 'signin' ? 'signin_with' : 'signup_with',
        logo_alignment: 'left',
      });
    }
  };

  const handleCredentialResponse = (response: any) => {
    try {
      if (!response.credential) {
        onError(new Error('No credential received from Google'));
        return;
      }

      // Decode the JWT credential to get user info
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      
      const googleUser = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        email_verified: payload.email_verified,
        credential: response.credential
      };

      onSuccess(googleUser);
    } catch (error) {
      console.error('Error parsing Google credential:', error);
      onError(error);
    }
  };

  const handleGoogleAuth = () => {
    if (window.google) {
      window.google.accounts.id.prompt();
    } else {
      onError(new Error('Google Identity Services not loaded'));
    }
  };

  return (
    <div className="w-full">
      {/* Google's official button will be rendered here */}
      <div ref={buttonRef} className="w-full" />
      
      {/* Fallback button if Google Services not available */}
      {!window.google && (
        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center justify-center gap-2 bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
          onClick={handleGoogleAuth}
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
          >
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>
      )}
    </div>
  );
};