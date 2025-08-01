import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export const CreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(true);

  useEffect(() => {
    const handleRedirect = async () => {
      if (!isAuthenticated) {
        // Redirect to login if not authenticated
        navigate('/login', { 
          state: { 
            from: '/create',
            message: 'Please sign in to create a new idea' 
          } 
        });
        return;
      }

      if (!user) {
        // Wait a bit for user data to load
        setTimeout(() => {
          if (!user) {
            navigate('/login');
          }
        }, 1000);
        return;
      }

      // User is authenticated, redirect to new idea creation
      setIsRedirecting(false);
      navigate('/ideas/new');
    };

    handleRedirect();
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          {isRedirecting ? 'Preparing your workspace...' : 'Redirecting to create...'}
        </p>
      </div>
    </div>
  );
}; 