import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { AlertCircle, CheckCircle, Clock, User, LogOut, RefreshCw } from 'lucide-react';

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  timestamp: Date;
}

export const AuthTestDashboard: React.FC = () => {
  const { user, token, isAuthenticated, logout, refreshToken, spendPoints } = useAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [socketStatus, setSocketStatus] = useState<'disconnected' | 'connected' | 'authenticated'>('disconnected');
  const [protocolStatus, setProtocolStatus] = useState<'disconnected' | 'connected'>('disconnected');

  const addTestResult = (test: string, status: 'success' | 'error', message: string) => {
    setTestResults(prev => [...prev, { test, status, message, timestamp: new Date() }]);
  };

  // Test Protocol Backend Connection
  const testProtocolConnection = async () => {
    try {
      const API_BASE_URL = process.env.VITE_PROTOCOL_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      
      if (response.ok) {
        setProtocolStatus('connected');
        addTestResult('Protocol Backend', 'success', `Connected: ${data.status} - ${data.agents} agents`);
      } else {
        setProtocolStatus('disconnected');
        addTestResult('Protocol Backend', 'error', 'Health check failed');
      }
    } catch (error) {
      setProtocolStatus('disconnected');
      addTestResult('Protocol Backend', 'error', `Connection failed: ${error.message}`);
    }
  };

  // Test Socket.io Connection to bor-server
  const testSocketConnection = async () => {
    try {
      const BOR_SERVER_URL = process.env.VITE_BOR_SERVER_URL || 'http://localhost:6969';
      
      // Test if authenticated user can connect to socket
      const socket = new WebSocket(`ws://localhost:6969/socket.io/?EIO=4&transport=websocket`);
      
      socket.onopen = () => {
        setSocketStatus('connected');
        addTestResult('bor-server Socket', 'success', 'Socket connection established');
        
        // Send auth token if available
        if (token) {
          socket.send(`42["authenticate",{"token":"${token}"}]`);
        }
      };

      socket.onmessage = (event) => {
        if (event.data.includes('authenticated')) {
          setSocketStatus('authenticated');
          addTestResult('Socket Authentication', 'success', 'Socket authenticated successfully');
        }
      };

      socket.onerror = () => {
        setSocketStatus('disconnected');
        addTestResult('bor-server Socket', 'error', 'Socket connection failed');
      };

      // Clean up after 5 seconds
      setTimeout(() => {
        socket.close();
      }, 5000);

    } catch (error) {
      addTestResult('bor-server Socket', 'error', `Socket test failed: ${error.message}`);
    }
  };

  // Test JWT Token Validation
  const testTokenValidation = async () => {
    if (!token) {
      addTestResult('Token Validation', 'error', 'No token available');
      return;
    }

    try {
      const API_BASE_URL = process.env.VITE_PROTOCOL_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        addTestResult('Token Validation', 'success', `Token valid - User: ${data.user.email}`);
      } else {
        addTestResult('Token Validation', 'error', 'Token validation failed');
      }
    } catch (error) {
      addTestResult('Token Validation', 'error', `Token test failed: ${error.message}`);
    }
  };

  // Test Points System
  const testPointsSystem = async () => {
    if (!user) {
      addTestResult('Points System', 'error', 'User not authenticated');
      return;
    }

    try {
      const success = await spendPoints(1);
      if (success) {
        addTestResult('Points System', 'success', 'Successfully spent 1 point');
      } else {
        addTestResult('Points System', 'error', 'Failed to spend points');
      }
    } catch (error) {
      addTestResult('Points System', 'error', `Points test failed: ${error.message}`);
    }
  };

  // Run All Tests
  const runAllTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);
    
    await testProtocolConnection();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testTokenValidation();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testSocketConnection();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await testPointsSystem();
    
    setIsRunningTests(false);
  };

  // Test Token Refresh
  const testTokenRefresh = async () => {
    try {
      const success = await refreshToken();
      if (success) {
        addTestResult('Token Refresh', 'success', 'Token refreshed successfully');
      } else {
        addTestResult('Token Refresh', 'error', 'Token refresh failed');
      }
    } catch (error) {
      addTestResult('Token Refresh', 'error', `Refresh failed: ${error.message}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
      case 'connected':
      case 'authenticated':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
      case 'disconnected':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
      case 'connected':
      case 'authenticated':
        return 'bg-green-100 text-green-800';
      case 'error':
      case 'disconnected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">BOR Protocol Authentication Test Dashboard</h1>
        <p className="text-gray-600">Comprehensive testing for Frontend → bor-server → Protocol authentication flow</p>
      </div>

      <div className="grid gap-6 mb-6">
        {/* Authentication Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Authentication Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Frontend Auth</p>
                  <p className="text-sm text-gray-600">
                    {isAuthenticated ? `Logged in as ${user?.email}` : 'Not authenticated'}
                  </p>
                </div>
                <Badge className={getStatusColor(isAuthenticated ? 'success' : 'error')}>
                  {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Socket Connection</p>
                  <p className="text-sm text-gray-600">bor-server WebSocket</p>
                </div>
                <Badge className={getStatusColor(socketStatus)}>
                  {socketStatus}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Protocol Backend</p>
                  <p className="text-sm text-gray-600">REST API Connection</p>
                </div>
                <Badge className={getStatusColor(protocolStatus)}>
                  {protocolStatus}
                </Badge>
              </div>
            </div>

            {isAuthenticated && user && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">User Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div><strong>Points:</strong> {user.points}</div>
                  <div><strong>Type:</strong> {user.user_type}</div>
                  <div><strong>Tier:</strong> {user.subscription_tier}</div>
                  <div><strong>Active:</strong> {user.is_active ? 'Yes' : 'No'}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
            <CardDescription>Run comprehensive tests to verify all authentication components</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={runAllTests} 
                disabled={isRunningTests}
                className="flex items-center gap-2"
              >
                {isRunningTests && <RefreshCw className="h-4 w-4 animate-spin" />}
                {isRunningTests ? 'Running Tests...' : 'Run All Tests'}
              </Button>
              
              <Button variant="outline" onClick={testProtocolConnection}>
                Test Protocol Backend
              </Button>
              
              <Button variant="outline" onClick={testSocketConnection}>
                Test Socket Connection
              </Button>
              
              <Button variant="outline" onClick={testTokenValidation}>
                Validate Token
              </Button>
              
              <Button variant="outline" onClick={testTokenRefresh}>
                Refresh Token
              </Button>
              
              <Button variant="outline" onClick={testPointsSystem}>
                Test Points System
              </Button>

              {isAuthenticated && (
                <Button variant="destructive" onClick={logout} className="flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>Real-time results from authentication tests</CardDescription>
          </CardHeader>
          <CardContent>
            {testResults.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No tests run yet. Click "Run All Tests" to begin.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <p className="font-medium">{result.test}</p>
                      <p className="text-sm text-gray-600">{result.message}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {result.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};