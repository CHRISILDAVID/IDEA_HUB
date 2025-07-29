import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  FileText, 
  Layout, 
  Eye, 
  Save, 
  Share2, 
  Settings,
  ArrowLeft,
  Plus,
  Wand2,
  MousePointer,
  Square,
  Circle,
  Diamond,
  Minus,
  Type,
  Image,
  MessageSquare,
  ChevronDown,
  Globe,
  Lock,
  Users,
  Tag
} from 'lucide-react';
import { CanvasEditor } from '../components/Canvas/CanvasEditor';
import { DocumentEditor } from '../components/Canvas/DocumentEditor';
import { CanvasToolbar } from '../components/Canvas/CanvasToolbar';
import { DocumentToolbar } from '../components/Canvas/DocumentToolbar';
import { ViewToggle } from '../components/Canvas/ViewToggle';
import { IdeaSetupModal } from '../components/Canvas/IdeaSetupModal';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Idea } from '../types';

interface CanvasObject {
  id: string;
  type: 'rectangle' | 'circle' | 'text' | 'line' | 'diamond';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  fontSize?: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  rotation?: number;
  points?: number[];
}

type ViewMode = 'document' | 'both' | 'canvas';

export const IdeaCanvasPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  
  const [idea, setIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('both');
  const [canvasObjects, setCanvasObjects] = useState<CanvasObject[]>([]);
  const [documentContent, setDocumentContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [isNewIdea, setIsNewIdea] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (id && id !== 'new') {
      fetchIdeaDetails();
    } else {
      setIsNewIdea(true);
      setShowSetupModal(true);
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (autoSave && (documentContent || canvasObjects.length > 0)) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        saveIdea();
      }, 2000);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [documentContent, canvasObjects, autoSave]);

  const fetchIdeaDetails = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const ideaResponse = await api.getIdea(id);
      setIdea(ideaResponse.data);
      setDocumentContent(ideaResponse.data.content || '');
      
      // Parse canvas objects from idea content or use defaults
      try {
        const canvasData = JSON.parse(ideaResponse.data.canvasData || '[]');
        setCanvasObjects(canvasData);
      } catch {
        setCanvasObjects([]);
      }
    } catch (err) {
      setError('Failed to load idea details');
      console.error('Error fetching idea details:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveIdea = async () => {
    if (!isAuthenticated) return;
    
    try {
      setSaving(true);
      
      if (isNewIdea) {
        // Create new idea
        const newIdeaData = {
          title: idea?.title || 'Untitled Idea',
          description: idea?.description || '',
          content: documentContent,
          canvasData: JSON.stringify(canvasObjects),
          category: idea?.category || 'general',
          tags: idea?.tags || [],
          visibility: idea?.visibility || 'public',
          language: idea?.language || 'en',
          status: 'published'
        };
        
        const response = await api.createIdea(newIdeaData);
        setIdea(response.data);
        setIsNewIdea(false);
        navigate(`/ideas/${response.data.id}`);
      } else if (idea) {
        // Update existing idea
        const updatedIdeaData = {
          ...idea,
          content: documentContent,
          canvasData: JSON.stringify(canvasObjects)
        };
        
        await api.updateIdea(idea.id, updatedIdeaData);
      }
    } catch (err) {
      console.error('Error saving idea:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCanvasObjectsChange = (objects: CanvasObject[]) => {
    setCanvasObjects(objects);
  };

  const handleDocumentContentChange = (content: string) => {
    setDocumentContent(content);
  };

  const handleSetupComplete = (setupData: {
    title: string;
    description: string;
    visibility: 'public' | 'private';
    tags: string[];
    category: string;
  }) => {
    setIdea({
      id: 'temp',
      title: setupData.title,
      description: setupData.description,
      content: '',
      author: user!,
      tags: setupData.tags,
      category: setupData.category,
      license: 'MIT',
      version: '1.0.0',
      stars: 0,
      forks: 0,
      isStarred: false,
      isFork: false,
      visibility: setupData.visibility,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      collaborators: [],
      comments: [],
      issues: [],
      status: 'draft'
    });
    setShowSetupModal(false);
  };

  const handleShare = async () => {
    if (!idea) return;
    
    try {
      await navigator.share({
        title: idea.title,
        text: idea.description,
        url: window.location.href,
      });
    } catch (error) {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error}
          </h2>
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            Go back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div>
                <input
                  type="text"
                  value={idea?.title || 'Untitled File'}
                  onChange={(e) => setIdea(prev => prev ? { ...prev, title: e.target.value } : null)}
                  className="text-lg font-semibold text-gray-900 dark:text-white bg-transparent border-none outline-none focus:ring-0"
                  placeholder="Untitled File"
                />
                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                  {idea?.visibility === 'public' ? (
                    <Globe className="w-3 h-3" />
                  ) : (
                    <Lock className="w-3 h-3" />
                  )}
                  <span className="capitalize">{idea?.visibility || 'public'}</span>
                  {idea?.tags.length > 0 && (
                    <>
                      <span>•</span>
                      <span>{idea.tags.length} tags</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <ViewToggle
              currentView={viewMode}
              onViewChange={setViewMode}
            />
            
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2" />
            
            <button
              onClick={handleShare}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Share
            </button>
            
            <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Document Panel */}
        {(viewMode === 'document' || viewMode === 'both') && (
          <div className={`${viewMode === 'both' ? 'w-1/2' : 'w-full'} flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700`}>
            <DocumentToolbar
              onContentChange={handleDocumentContentChange}
              onSave={saveIdea}
              saving={saving}
            />
            <DocumentEditor
              content={documentContent}
              onChange={handleDocumentContentChange}
              readOnly={!isAuthenticated}
            />
          </div>
        )}

        {/* Canvas Panel */}
        {(viewMode === 'canvas' || viewMode === 'both') && (
          <div className={`${viewMode === 'both' ? 'w-1/2' : 'w-full'} flex flex-col bg-gray-50 dark:bg-gray-900`}>
            <CanvasToolbar />
            <CanvasEditor
              initialObjects={canvasObjects}
              readOnly={!isAuthenticated}
              onObjectsChange={handleCanvasObjectsChange}
            />
          </div>
        )}
      </div>

      {/* Setup Modal for New Ideas */}
      {showSetupModal && (
        <IdeaSetupModal
          onComplete={handleSetupComplete}
          onCancel={() => navigate('/')}
        />
      )}
    </div>
  );
}; 