import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from '../components/AuthModal';
import { AuthTestDashboard } from '../components/auth/AuthTestDashboard';
import { Button } from '../components/ui/button';

export const AuthTestPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(!isAuthenticated);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">BOR Protocol Authentication Test</h1>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-700">
                    Welcome, {user?.name || user?.email}
                  </span>
                  <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    <span>Authenticated</span>
                  </div>
                </div>
              ) : (
                <Button onClick={() => setShowAuthModal(true)}>
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {isAuthenticated ? (
          <AuthTestDashboard />
        ) : (
          <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
            <div className="text-center">
              <div className="mb-8">
                <div className="mx-auto h-24 w-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="h-12 w-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
                <p className="text-gray-600 mb-6 max-w-md">
                  Please sign in to access the comprehensive authentication testing dashboard.
                  Test the complete flow from frontend to Protocol backend.
                </p>
              </div>

              <div className="space-y-4">
                <Button 
                  onClick={() => setShowAuthModal(true)}
                  size="lg"
                  className="w-48"
                >
                  Sign In / Sign Up
                </Button>
                
                <div className="text-sm text-gray-500">
                  <p>Demo credentials: <strong>demo@bor.ai</strong> / <strong>password123</strong></p>
                  <p>Or use any email to create a new account</p>
                </div>
              </div>

              {/* Features Preview */}
              <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="text-center">
                  <div className="mx-auto h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-gray-900">Frontend Authentication</h3>
                  <p className="text-sm text-gray-600 mt-1">Test React authentication with JWT tokens</p>
                </div>

                <div className="text-center">
                  <div className="mx-auto h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-gray-900">Socket.io Integration</h3>
                  <p className="text-sm text-gray-600 mt-1">Real-time authentication with bor-server</p>
                </div>

                <div className="text-center">
                  <div className="mx-auto h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                    <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-gray-900">Protocol Backend</h3>
                  <p className="text-sm text-gray-600 mt-1">Full REST API integration with PostgreSQL</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
};