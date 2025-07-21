import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout/Layout';
import { CanvasEditor } from '../components/Canvas/CanvasEditor';
import { 
  Eye, 
  Calendar,
  Tag,
  Share2,
  Bookmark,
  MoreHorizontal,
  ArrowLeft,
  Users,
  Globe,
  Lock
} from 'lucide-react';
import { StarButton } from '../components/Ideas/StarButton';
import { ForkButton } from '../components/Ideas/ForkButton';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Idea } from '../types';

interface CanvasObject {
  id: string;
  type: 'rectangle' | 'circle' | 'text' | 'line';
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

export const IdeaDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canvasObjects, setCanvasObjects] = useState<CanvasObject[]>([]);

  useEffect(() => {
    if (id) {
      fetchIdeaDetails();
    }
  }, [id]);

  const fetchIdeaDetails = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const ideaResponse = await api.getIdea(id);
      setIdea(ideaResponse.data);
      
      // Initialize with some default canvas objects for demonstration
      setCanvasObjects([
        {
          id: 'demo-rect-1',
          type: 'rectangle',
          x: 100,
          y: 100,
          width: 150,
          height: 100,
          fill: '#3b82f6',
          stroke: '#1e40af',
          strokeWidth: 2,
          rotation: 0
        },
        {
          id: 'demo-text-1',
          type: 'text',
          x: 120,
          y: 140,
          text: ideaResponse.data.title,
          fontSize: 18,
          fill: '#ffffff',
          stroke: 'transparent',
          strokeWidth: 0,
          rotation: 0
        },
        {
          id: 'demo-circle-1',
          type: 'circle',
          x: 350,
          y: 150,
          radius: 60,
          fill: '#10b981',
          stroke: '#059669',
          strokeWidth: 2,
          rotation: 0
        },
        {
          id: 'demo-text-2',
          type: 'text',
          x: 320,
          y: 145,
          text: 'Idea',
          fontSize: 16,
          fill: '#ffffff',
          stroke: 'transparent',
          strokeWidth: 0,
          rotation: 0
        }
      ]);
    } catch (err) {
      setError('Failed to load idea details');
      console.error('Error fetching idea details:', err);
    } finally {
      setLoading(false);
    }
  };

  // No longer need handleStar - using StarButton component instead

  // No longer need handleFork - using ForkButton component instead

  const handleShare = async () => {
    if (!idea) return;
    
    try {
      await navigator.share({
        title: idea.title,
        text: idea.description,
        url: window.location.href,
      });
    } catch (error) {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      // You could show a toast notification here
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleCanvasObjectsChange = (objects: CanvasObject[]) => {
    setCanvasObjects(objects);
    // Here you could save the canvas state to localStorage or a backend
    // localStorage.setItem(`canvas-${id}-${user?.id}`, JSON.stringify(objects));
  };

  if (loading) {
    return (
      <Layout showSidebar={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error || !idea) {
    return (
      <Layout showSidebar={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {error || 'Idea not found'}
            </h2>
            <Link
              to="/"
              className="text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              Go back to home
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={false}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                
                <div className="flex items-center space-x-3">
                  <Link to={`/profile/${idea.author.username}`}>
                    <img
                      src={idea.author.avatar || `https://ui-avatars.com/api/?name=${idea.author.fullName}&background=random`}
                      alt={idea.author.fullName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  </Link>
                  <div>
                    <Link
                      to={`/profile/${idea.author.username}`}
                      className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {idea.author.fullName}
                    </Link>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(idea.createdAt)}</span>
                      <span>•</span>
                      <div className="flex items-center space-x-1">
                        {idea.visibility === 'public' ? (
                          <Globe className="w-3 h-3" />
                        ) : (
                          <Lock className="w-3 h-3" />
                        )}
                        <span className="capitalize">{idea.visibility}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleShare}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Share"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                
                {isAuthenticated && (
                  <button
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Bookmark"
                  >
                    <Bookmark className="w-5 h-5" />
                  </button>
                )}
                
                <button
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="More options"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Idea Info */}
            <div className="pb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                {idea.title}
              </h1>
              
              <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                {idea.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {idea.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/search?tag=${encodeURIComponent(tag)}`}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Link>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-4">
                <StarButton 
                  ideaId={idea.id}
                  initialStarCount={idea.stars}
                  isInitiallyStarred={idea.isStarred}
                  className="px-4 py-2 rounded-lg font-medium transition-colors"
                />
                
                <ForkButton 
                  idea={idea}
                  className="px-4 py-2 rounded-lg font-medium transition-colors"
                />

                <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                  <Eye className="w-4 h-4" />
                  <span>{idea.stars + idea.forks} views</span>
                </div>

                {idea.collaborators.length > 0 && (
                  <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                    <Users className="w-4 h-4" />
                    <span>{idea.collaborators.length} collaborators</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1">
          <CanvasEditor
            initialObjects={canvasObjects}
            readOnly={false}
            onObjectsChange={handleCanvasObjectsChange}
          />
        </div>
      </div>
    </Layout>
  );
};