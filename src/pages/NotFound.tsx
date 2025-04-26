import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <AlertCircle size={64} className="text-teal-600 dark:text-teal-500" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">404</h1>
        <h2 className="text-xl text-gray-700 dark:text-gray-300 mb-4">Page Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
        >
          Go Back Home
        </button>
      </div>
    </div>
  );
};

export default NotFound;