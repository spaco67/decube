import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  
  const { login, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      redirectBasedOnRole(user.role);
    }
  }, [user]);

  const redirectBasedOnRole = (role: string) => {
    switch (role) {
      case 'waiter':
        navigate('/waiter');
        break;
      case 'barman':
        navigate('/barman');
        break;
      case 'kitchen':
        navigate('/kitchen');
        break;
      case 'admin':
        navigate('/admin');
        break;
      default:
        navigate('/');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const userData = await login(email, password);
      if (!userData) {
        throw new Error('Login failed. Please try again.');
      }
      redirectBasedOnRole(userData.role);
    } catch (err: any) {
      if (err.message.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(err.message || 'Failed to login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden">
          <div className="px-8 py-6 bg-teal-600 dark:bg-teal-700">
            <div className="flex items-center justify-center mb-4">
              <img 
                src="https://images.unsplash.com/photo-1745596703704-8454fc9b04df?q=80&w=64&auto=format&fit=crop" 
                alt="DECUBE Logo"
                className="w-16 h-16 rounded-full shadow-lg border-2 border-white"
              />
            </div>
            <h1 className="text-2xl font-bold text-center text-white">DECUBE</h1>
            <p className="text-teal-100 text-center">Bar & Restaurant Management</p>
          </div>
          
          <div className="px-8 py-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6 text-center">
              Sign in to your account
            </h2>
            
            {error && (
              <div className={`mb-4 p-3 rounded-md ${
                error.includes('ready') || error.includes('already set up')
                  ? 'bg-green-100 border border-green-200 text-green-700'
                  : 'bg-red-100 border border-red-200 text-red-700'
              }`}>
                {error}
              </div>
            )}
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-700 dark:text-white"
                  placeholder="your.email@example.com"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-700 dark:text-white"
                  placeholder="••••••••"
                />
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors ${
                    isLoading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>
            
            <div className="mt-4">
              <button
                onClick={() => setIsSigningUp(true)}
                className="w-full flex justify-center py-2 px-4 border border-teal-600 rounded-md shadow-sm text-sm font-medium text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors"
              >
                Create Admin Account
              </button>
            </div>
          </div>
          
          {/* Signup Modal */}
          {isSigningUp && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex min-h-screen items-center justify-center p-4">
                <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsSigningUp(false)}></div>
                <div className="relative w-full max-w-md transform rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Create Admin Account</h3>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    setError('');
                    setIsLoading(true);
                    
                    try {
                      await signUp(email, password, email.split('@')[0], 'admin');
                      setIsSigningUp(false);
                      navigate('/admin');
                    } catch (err: any) {
                      setError(err.message || 'Failed to create account');
                    } finally {
                      setIsLoading(false);
                    }
                  }} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setIsSigningUp(false)}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md disabled:opacity-50"
                      >
                        {isLoading ? 'Creating...' : 'Create Account'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
        <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Developed with ❤️ by <a href="https://zeustek.ng/" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700 dark:text-teal-500 dark:hover:text-teal-400">Zeustek Hub</a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;