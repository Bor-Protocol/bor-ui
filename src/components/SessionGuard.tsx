import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSessionBooking } from '../hooks/useSessionBooking';
import { AuthModal } from './AuthModal';
import { BookingAuthModal } from './BookingAuthModal';

interface SessionGuardProps {
  children: React.ReactNode;
}


export const SessionGuard: React.FC<SessionGuardProps> = ({ children }) => {
  const { modelName } = useParams<{ modelName: string }>();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  const isPreview = searchParams.get('preview') === 'true';
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { checkAccess, bookSession, validateAccess, isLoading } = useSessionBooking();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [modelConfig, setModelConfig] = useState<any>(null);
  const [availability, setAvailability] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!modelName) return;
    
    checkModelAccess();
  }, [modelName, isAuthenticated, sessionId, isPreview]);

  const checkModelAccess = async () => {
    if (!modelName) return;

    try {
      setAccessChecked(false);
      setError(null);

      // For preview mode, bypass authentication checks and allow access
      if (isPreview) {
        setHasAccess(true);
        setAccessChecked(true);
        return;
      }

      // Check model access
      const accessResponse = await checkAccess(modelName);
      setModelConfig(accessResponse.modelConfig);
      setAvailability(accessResponse.availability);

      if (!accessResponse.success) {
        if (accessResponse.error === 'Insufficient points') {
          setError(`You need ${accessResponse.required} points but only have ${accessResponse.current}`);
          setAccessChecked(true);
          return;
        }
        setError(accessResponse.error || 'Failed to check access');
        setAccessChecked(true);
        return;
      }

      // For free models, allow immediate access
      if (accessResponse.modelConfig.accessType === 'free') {
        setHasAccess(true);
        setAccessChecked(true);
        return;
      }

      // For premium models, require authentication
      if (!isAuthenticated) {
        setShowBookingModal(true);
        setAccessChecked(true);
        return;
      }

      // If access is granted (e.g., user has an existing session for this model)
      if (accessResponse.access === 'granted') {
        setHasAccess(true);
        setAccessChecked(true);
        return;
      }

      // Check if user already has an existing session with sessionId
      if (sessionId) {
        const isValid = await validateAccess(modelName, sessionId);
        if (isValid) {
          setHasAccess(true);
          setAccessChecked(true);
          return;
        }
      }

      // Check if user has any active session for this model
      const isValid = await validateAccess(modelName);
      if (isValid) {
        setHasAccess(true);
        setAccessChecked(true);
        return;
      }

      // User needs to book a session
      setShowBookingModal(true);
      setAccessChecked(true);

    } catch (err: any) {
      setError(err.message || 'Failed to check access');
      setAccessChecked(true);
    }
  };

  const handleBookSession = async () => {
    if (!modelName) return;

    try {
      const result = await bookSession(modelName);
      
      if (result.success && result.session) {
        setShowBookingModal(false);
        
        if (result.session.status === 'active') {
          // Session started immediately
          setHasAccess(true);
          
          // Update URL with session ID if provided
          if (result.session.redirectUrl) {
            navigate(result.session.redirectUrl, { replace: true });
          }
        } else if (result.session.status === 'queued') {
          // Added to queue
          setError(`Added to queue! Position: #${result.session.queuePosition}. Estimated wait: ${result.session.estimatedWaitMinutes} minutes.`);
        }
      } else {
        setError(result.error || 'Failed to book session');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to book session');
    }
  };

  // Loading state
  if (!accessChecked || isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Checking access...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !showBookingModal) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center max-w-md mx-4">
          <h2 className="text-xl font-bold mb-4">Access Denied</h2>
          <p className="mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/')}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Return to Home
            </button>
            <button
              onClick={checkModelAccess}
              className="w-full px-4 py-2 border border-gray-300 text-white rounded hover:bg-gray-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render children if access is granted
  if (hasAccess) {
    return <>{children}</>;
  }

  // Render modals
  return (
    <>
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Preparing session...</p>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          navigate('/');
        }}
      />

      <BookingAuthModal
        isOpen={showBookingModal}
        onClose={() => {
          setShowBookingModal(false);
          navigate('/');
        }}
        onSuccess={() => {
          setShowBookingModal(false);
          // After successful auth, retry the access check
          checkModelAccess();
        }}
        modelConfig={modelConfig}
      />
    </>
  );
};