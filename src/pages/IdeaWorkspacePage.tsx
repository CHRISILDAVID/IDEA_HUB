import React, { useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setViewMode, setDocumentPanelWidth, setLoading, setSaving, setLastSaved } from '../store/slices/workspaceSlice';
import { loadIdea, createNewIdea, markSaved } from '../store/slices/ideaSlice';
import { WorkspaceTopBar } from '../components/Workspace/WorkspaceTopBar';
import { DocumentEditor } from '../components/Workspace/DocumentEditor';
import { CanvasEditor } from '../components/Workspace/CanvasEditor';
import { DocumentToolbar } from '../components/Workspace/DocumentToolbar';
import { CanvasToolbar } from '../components/Workspace/CanvasToolbar';
import { IdeaSetupModal } from '../components/Canvas/IdeaSetupModal';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export const IdeaWorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAuth();
  
  const { viewMode, documentPanelWidth, isLoading, isSaving } = useAppSelector(state => state.workspace);
  const { currentIdea, title, documentContent, canvasObjects, isNewIdea, isDirty } = useAppSelector(state => state.idea);
  
  const [showSetupModal, setShowSetupModal] = React.useState(false);
  const [isResizing, setIsResizing] = React.useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize workspace
  useEffect(() => {
    if (id && id !== 'new') {
      fetchIdeaDetails();
    } else {
      setShowSetupModal(true);
    }
  }, [id]);

  // Auto-save functionality
  useEffect(() => {
    if (isDirty && !isNewIdea && currentIdea) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        saveIdea();
      }, 2000);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [isDirty, isNewIdea, currentIdea, title, documentContent, canvasObjects]);

  const fetchIdeaDetails = async () => {
    if (!id) return;
    
    try {
      dispatch(setLoading(true));
      const response = await api.getIdea(id);
      dispatch(loadIdea(response.data));
    } catch (error) {
      console.error('Error fetching idea:', error);
      navigate('/');
    } finally {
      dispatch(setLoading(false));
    }
  };

  const saveIdea = async () => {
    if (!isAuthenticated || isSaving) return;
    
    try {
      dispatch(setSaving(true));
      
      if (isNewIdea) {
        // Create new idea
        const newIdeaData = {
          title,
          description: title,
          content: documentContent,
          canvasData: JSON.stringify(canvasObjects),
          category: 'general',
          tags: [],
          visibility: 'public' as const,
          status: 'published' as const
        };
        
        const response = await api.createIdea(newIdeaData);
        dispatch(loadIdea(response.data));
        navigate(`/ideas/${response.data.id}`, { replace: true });
      } else if (currentIdea) {
        // Update existing idea
        await api.updateIdea(currentIdea.id, {
          title,
          content: documentContent,
          canvasData: JSON.stringify(canvasObjects)
        });
        
        dispatch(markSaved());
      }
      
      dispatch(setLastSaved(new Date().toISOString()));
    } catch (error) {
      console.error('Error saving idea:', error);
    } finally {
      dispatch(setSaving(false));
    }
  };

  const handleSetupComplete = (setupData: {
    title: string;
    description: string;
    visibility: 'public' | 'private';
    tags: string[];
    category: string;
  }) => {
    dispatch(createNewIdea(setupData));
    setShowSetupModal(false);
  };

  // Handle panel resizing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (viewMode !== 'both') return;
    setIsResizing(true);
    e.preventDefault();
  }, [viewMode]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    dispatch(setDocumentPanelWidth(newWidth));
  }, [isResizing, dispatch]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">
      {/* Top Bar */}
      <WorkspaceTopBar onSave={saveIdea} />

      {/* Main Content */}
      <div ref={containerRef} className="flex-1 flex relative overflow-hidden">
        {/* Document Panel */}
        {(viewMode === 'document' || viewMode === 'both') && (
          <div 
            className="flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-hidden"
            style={{ 
              width: viewMode === 'both' ? `${documentPanelWidth}%` : '100%',
              minWidth: viewMode === 'both' ? '300px' : 'auto'
            }}
          >
            <DocumentToolbar />
            <DocumentEditor />
          </div>
        )}

        {/* Resizer */}
        {viewMode === 'both' && (
          <div
            className="w-1 bg-gray-200 dark:bg-gray-700 cursor-col-resize hover:bg-blue-500 transition-colors relative group"
            onMouseDown={handleMouseDown}
          >
            <div className="absolute inset-y-0 left-1/2 transform -translate-x-1/2 w-4 flex items-center justify-center">
              <div className="w-1 h-8 bg-gray-400 dark:bg-gray-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        )}

        {/* Canvas Panel */}
        {(viewMode === 'canvas' || viewMode === 'both') && (
          <div 
            className="flex flex-col bg-gray-50 dark:bg-gray-900 relative overflow-hidden"
            style={{ 
              width: viewMode === 'both' ? `${100 - documentPanelWidth}%` : '100%',
              minWidth: viewMode === 'both' ? '300px' : 'auto'
            }}
          >
            <CanvasToolbar />
            <CanvasEditor />
          </div>
        )}
      </div>

      {/* Setup Modal */}
      {showSetupModal && (
        <IdeaSetupModal
          onComplete={handleSetupComplete}
          onCancel={() => navigate('/')}
        />
      )}
    </div>
  );
};