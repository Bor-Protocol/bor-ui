import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GoogleAuthButton } from './auth/GoogleAuthButton';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, signup, googleAuth, isLoading } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (mode === 'login') {
        const result = await login(formData.email, formData.password);
        if (result.success) {
          setFormData({ name: '', email: '', password: '' });
          setError('');
          onClose();
        } else {
          setError(result.error || 'Login failed');
        }
      } else {
        const result = await signup(formData.name, formData.email, formData.password);
        if (result.success) {
          setFormData({ name: '', email: '', password: '' });
          setError('');
          onClose();
        } else {
          setError(result.error || 'Signup failed');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleGoogleSuccess = async (googleUser: any) => {
    try {
      setError('');
      
      // Use real Google OAuth authentication
      const result = await googleAuth(googleUser);
      
      if (result.success) {
        if (result.isNewUser) {
          console.log('New user created via Google OAuth:', googleUser.email);
        } else {
          console.log('Existing user logged in via Google OAuth:', googleUser.email);
        }
        setFormData({ name: '', email: '', password: '' });
        setError('');
        onClose();
      } else {
        setError(result.error || 'Google authentication failed');
      }
    } catch (err) {
      console.error('Google auth error:', err);
      setError('Google authentication failed');
    }
  };

  const handleGoogleError = (error: any) => {
    console.error('Google OAuth error:', error);
    setError('Google authentication was cancelled or failed');
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-slate-900 rounded-2xl w-full max-w-md border border-white/20 shadow-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative p-6 border-b border-white/10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            type="button"
          >
            ×
          </button>
          
          <div className="text-center pr-8">
            <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-xl">
              🚀
            </div>
            <h2 className="text-xl font-bold text-white mb-1">
              {mode === 'login' ? 'Welcome Back!' : 'Join BOR Platform'}
            </h2>
            <p className="text-sm text-gray-300">
              {mode === 'login' ? 'Sign in to continue your AI journey' : 'Create your account and get 100 free points'}
            </p>
          </div>
        </div>

        <div className="p-6">
          {/* Welcome Info */}
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 mb-6 border border-white/10">
            <h3 className="text-white font-medium mb-2 flex items-center gap-2">
              🎁 {mode === 'login' ? 'Welcome back!' : 'Free starter pack'}
            </h3>
            <p className="text-gray-300 text-sm mb-3">
              {mode === 'login' 
                ? 'Access your AI agents and continue where you left off.' 
                : 'Get started instantly with everything you need for AI conversations.'
              }
            </p>
            
            {mode === 'signup' && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-white font-medium mb-1">🎁 Instant Benefits</div>
                  <ul className="text-gray-300 space-y-1">
                    <li>• 💰 100 free points</li>
                    <li>• 🔒 Private sessions</li>
                    <li>• 📊 Session history</li>
                  </ul>
                </div>
                <div>
                  <div className="text-white font-medium mb-1">🚀 Premium Features</div>
                  <ul className="text-gray-300 space-y-1">
                    <li>• 🎯 Book any agent</li>
                    <li>• ⭐ Save favorites</li>
                    <li>• 🔄 Daily points</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Mode Toggle */}
          <div className="flex bg-black/30 rounded-lg p-1 mb-4 border border-white/10">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Google OAuth Button */}
          <div className="mb-4">
            <GoogleAuthButton
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              mode={mode}
            />
          </div>

          {/* Divider */}
          <div className="flex items-center mb-4">
            <div className="flex-1 border-t border-white/20"></div>
            <span className="px-3 text-xs text-gray-400">or use email</span>
            <div className="flex-1 border-t border-white/20"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required={mode === 'signup'}
                  className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 text-sm"
                  placeholder="Full name"
                />
              </div>
            )}

            <div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 text-sm"
                placeholder="Email address"
              />
            </div>

            <div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 text-sm"
                placeholder="Password"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                `${mode === 'login' ? 'Sign In' : 'Create Account'} →`
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="text-purple-400 hover:text-purple-300 font-medium"
              >
                {mode === 'login' ? 'Create one free' : 'Sign in instead'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};