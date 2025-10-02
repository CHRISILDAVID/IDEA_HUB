import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // For Prisma-based auth, the token is already stored in localStorage
        // by the AuthService during signup/signin
        // This callback is mainly for email confirmation redirects
        
        // Check if there's a confirmation parameter
        const urlParams = new URLSearchParams(window.location.search);
        const confirmed = urlParams.get('confirmed');
        
        if (confirmed === 'true') {
          // Email confirmed, redirect to home
          navigate('/?confirmed=true');
        } else {
          // No confirmation needed, just redirect to login
          navigate('/login');
        }
      } catch (error) {
        console.error('Unexpected error during auth callback:', error);
        navigate('/login?error=unexpected');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Processing...
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Please wait a moment.
        </p>
      </div>
    </div>
  );
};