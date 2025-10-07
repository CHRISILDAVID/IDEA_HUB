import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface WorkspaceIframeProps {
  workspaceId: string;
  ideaId: string;
  mode: 'view' | 'edit';
  canFork?: boolean;
  onFork?: () => void;
}

export const WorkspaceIframe: React.FC<WorkspaceIframeProps> = ({
  workspaceId,
  ideaId,
  mode,
  canFork = false,
  onFork,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();

  // Get auth token
  const token = localStorage.getItem('auth_token');

  // Construct workspace URL
  const WORKSPACE_APP_URL = import.meta.env.VITE_WORKSPACE_APP_URL || 'http://localhost:3001';
  const workspaceUrl = `${WORKSPACE_APP_URL}/workspace/${workspaceId}?mode=${mode}&token=${token}&readOnly=${mode === 'view'}`;

  // Handle messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin (in development, allow localhost)
      const allowedOrigins = [
        'http://localhost:3001',
        'http://127.0.0.1:3001',
        WORKSPACE_APP_URL,
      ];
      
      if (!allowedOrigins.some(origin => event.origin.includes(origin.replace(/:\d+$/, '')))) {
        console.warn('Message from untrusted origin:', event.origin);
        return;
      }

      const { type, payload, source } = event.data;

      // Only handle messages from workspace
      if (source !== 'workspace') return;

      switch (type) {
        case 'WORKSPACE_LOADED':
          setIsLoaded(true);
          console.log('Workspace loaded successfully');
          break;

        case 'FORK_REQUEST':
          if (onFork) onFork();
          break;

        case 'SAVE_SUCCESS':
          console.log('Workspace saved:', payload);
          // Optional: Show toast notification
          break;

        case 'TITLE_CHANGED':
          // Update idea title if needed
          console.log('Title changed:', payload.title);
          break;

        case 'ERROR':
          console.error('Workspace error:', payload);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onFork, WORKSPACE_APP_URL]);

  return (
    <div className="workspace-iframe-container w-full h-full relative">
      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading workspace...</p>
          </div>
        </div>
      )}

      {/* Read-only banner */}
      {mode === 'view' && canFork && (
        <div className="absolute top-0 left-0 right-0 bg-yellow-100 dark:bg-yellow-900 px-4 py-2 flex items-center justify-between z-10">
          <span className="text-sm text-yellow-800 dark:text-yellow-200">
            📖 You're viewing this workspace in read-only mode
          </span>
          <button
            onClick={onFork}
            className="px-4 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm font-medium"
          >
            Fork to Edit
          </button>
        </div>
      )}

      {/* Iframe */}
      <iframe
        ref={iframeRef}
        src={workspaceUrl}
        className={`w-full h-full border-0 ${mode === 'view' && canFork ? 'mt-10' : ''}`}
        title="Workspace Editor"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
};
