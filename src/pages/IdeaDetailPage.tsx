import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  ArrowLeft,
  Globe,
  Lock,
  Edit3,
  Eye,
  Save,
  MousePointer,
  Square,
  Circle,
  Diamond,
  Type,
  Pen,
  StickyNote,
  ArrowRight,
  Link as LinkIcon
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Stage, Layer, Rect, Circle as KonvaCircle, Text, Line } from 'react-konva';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Idea } from '../types';

// Types for canvas objects
interface CanvasObject {
  id: string;
  type: 'rectangle' | 'circle' | 'text' | 'sticky' | 'connector' | 'diamond' | 'pen';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  fontSize?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  rotation?: number;
  points?: number[];
  color?: string;
  scaleX?: number;
  scaleY?: number;
}

type CanvasTool = 'select' | 'rectangle' | 'circle' | 'diamond' | 'text' | 'sticky' | 'connector' | 'pen';
type UserRole = 'owner' | 'collaborator' | 'viewer';

export const IdeaDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  // State management
  const [idea, setIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('viewer');
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Content state
  const [markdownContent, setMarkdownContent] = useState('');
  const [canvasObjects, setCanvasObjects] = useState<CanvasObject[]>([]);
  const [activeTool, setActiveTool] = useState<CanvasTool>('select');
  
  // Layout state
  const [leftPaneWidth, setLeftPaneWidth] = useState(50); // percentage
  const [isResizing, setIsResizing] = useState(false);
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const markdownRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-save states
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Fetch idea details and user permissions
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
      const ideaData = ideaResponse.data;
      
      setIdea(ideaData);
      setMarkdownContent(ideaData.content || '');
      
      // Parse canvas data
      try {
        const canvasData = JSON.parse(ideaData.canvasData || '[]');
        setCanvasObjects(canvasData);
      } catch {
        setCanvasObjects([]);
      }
      
      // Determine user role
      await fetchUserRole(ideaData);
      
    } catch (err) {
      setError('Failed to load idea details');
      console.error('Error fetching idea details:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRole = async (ideaData: Idea) => {
    if (!isAuthenticated || !user) {
      setUserRole('viewer');
      return;
    }

    try {
      // Check if user is the owner
      if (ideaData.author.id === user.id) {
        setUserRole('owner');
        setIsEditMode(true); // Owners default to edit mode
        return;
      }

      // Check if user is a collaborator (this will need API endpoint)
      // For now, we'll use a simple check, but you should implement proper API call
      const collaboratorResponse = await api.getIdeaCollaborators(ideaData.id);
      const userCollaborator = collaboratorResponse.data.find((c: any) => c.user_id === user.id);
      
      if (userCollaborator) {
        setUserRole('collaborator');
        setIsEditMode(true); // Collaborators default to edit mode
      } else {
        setUserRole('viewer');
      }
    } catch (err) {
      console.error('Error fetching user role:', err);
      setUserRole('viewer');
    }
  };

  // Auto-save functionality
  const saveContent = useCallback(async () => {
    if (!idea || userRole === 'viewer' || saving) return;
    
    try {
      setSaving(true);
      await api.updateIdea(idea.id, {
        content: markdownContent,
        canvasData: JSON.stringify(canvasObjects)
      });
      setLastSaved(new Date());
    } catch (err) {
      console.error('Error saving content:', err);
    } finally {
      setSaving(false);
    }
  }, [idea, markdownContent, canvasObjects, userRole, saving]);

  // Debounced auto-save
  useEffect(() => {
    if (userRole !== 'viewer') {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        saveContent();
      }, 2000); // Save after 2 seconds of inactivity
    }
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [markdownContent, canvasObjects, saveContent, userRole]);

  // Regular interval save (every 5 seconds if there are changes)
  useEffect(() => {
    if (userRole !== 'viewer') {
      const interval = setInterval(() => {
        saveContent();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [saveContent, userRole]);

  // Handle pane resizing
  const handleMouseDown = (e: React.MouseEvent) => {
    if (userRole === 'viewer') return;
    setIsResizing(true);
    e.preventDefault();
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    // Constrain between 20% and 80%
    const constrainedWidth = Math.max(20, Math.min(80, newLeftWidth));
    setLeftPaneWidth(constrainedWidth);
  }, [isResizing]);

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

  // Canvas handlers
  const handleCanvasObjectsChange = (newObjects: CanvasObject[]) => {
    if (userRole !== 'viewer') {
      setCanvasObjects(newObjects);
    }
  };

  const handleMarkdownChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (userRole !== 'viewer') {
      setMarkdownContent(e.target.value);
    }
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

  const handleFork = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const response = await api.forkIdea(id!);
      navigate(`/ideas/${response.data.id}`);
    } catch (err) {
      console.error('Error forking idea:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !idea) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error || 'Idea not found'}
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
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {idea.title}
                </h1>
                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                  {idea.visibility === 'public' ? (
                    <Globe className="w-3 h-3" />
                  ) : (
                    <Lock className="w-3 h-3" />
                  )}
                  <span className="capitalize">{idea.visibility}</span>
                  {idea.tags.length > 0 && (
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
            {/* Mode Toggle for Owner/Collaborator */}
            {(userRole === 'owner' || userRole === 'collaborator') && (
              <>
                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`px-3 py-2 rounded-lg transition-colors text-sm font-medium flex items-center space-x-1 ${
                    isEditMode 
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {isEditMode ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{isEditMode ? 'Edit Mode' : 'View Mode'}</span>
                </button>
                
                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2" />
              </>
            )}
            
            {/* Save Status */}
            {userRole !== 'viewer' && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {saving ? (
                  <span className="flex items-center space-x-1">
                    <Save className="w-3 h-3 animate-spin" />
                    <span>Saving...</span>
                  </span>
                ) : lastSaved ? (
                  <span>Saved {lastSaved.toLocaleTimeString()}</span>
                ) : null}
              </div>
            )}
            
            <button
              onClick={handleShare}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center space-x-1"
            >
              <span>Share</span>
              <LinkIcon className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleFork}
              className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium"
            >
              Fork
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Two Pane Layout */}
      <div 
        ref={containerRef}
        className="flex h-[calc(100vh-64px)] relative"
      >
        {/* Left Pane - Markdown Editor */}
        <div 
          className="flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700"
          style={{ width: `${leftPaneWidth}%` }}
        >
          <div className="flex-1 p-6 overflow-auto">
            {isEditMode && userRole !== 'viewer' ? (
              <textarea
                ref={markdownRef}
                value={markdownContent}
                onChange={handleMarkdownChange}
                placeholder="Start writing your markdown content here..."
                className="w-full h-full resize-none border-none outline-none bg-transparent text-gray-900 dark:text-white font-mono text-sm leading-relaxed"
              />
            ) : (
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <ReactMarkdown>
                  {markdownContent || 'No content yet. Start editing to add content.'}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>

        {/* Draggable Splitter */}
        <div
          className="w-1 bg-gray-200 dark:bg-gray-700 cursor-col-resize hover:bg-blue-500 transition-colors"
          onMouseDown={handleMouseDown}
        />

        {/* Right Pane - Canvas Editor */}
        <div 
          className="flex flex-col bg-gray-50 dark:bg-gray-900 relative"
          style={{ width: `${100 - leftPaneWidth}%` }}
        >
          {/* Canvas Toolbar - Only visible in edit mode */}
          {isEditMode && userRole !== 'viewer' && (
            <CanvasToolbar activeTool={activeTool} onToolSelect={setActiveTool} />
          )}
          
          {/* Canvas */}
          <div className="flex-1 overflow-hidden">
            <CanvasEditor
              objects={canvasObjects}
              onObjectsChange={handleCanvasObjectsChange}
              activeTool={activeTool}
              readOnly={!isEditMode || userRole === 'viewer'}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Canvas Toolbar Component
const CanvasToolbar: React.FC<{
  activeTool: CanvasTool;
  onToolSelect: (tool: CanvasTool) => void;
}> = ({ activeTool, onToolSelect }) => {
  const tools = [
    { id: 'select', icon: MousePointer, label: 'Select' },
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'diamond', icon: Diamond, label: 'Diamond' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'sticky', icon: StickyNote, label: 'Sticky Note' },
    { id: 'connector', icon: ArrowRight, label: 'Connector' },
    { id: 'pen', icon: Pen, label: 'Pen' },
  ];

  return (
    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 space-y-1">
      {tools.map((tool) => {
        const Icon = tool.icon;
        return (
          <button
            key={tool.id}
            onClick={() => onToolSelect(tool.id as CanvasTool)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              activeTool === tool.id
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title={tool.label}
          >
            <Icon className="w-5 h-5" />
          </button>
        );
      })}
    </div>
  );
};

// Canvas Editor Component
const CanvasEditor: React.FC<{
  objects: CanvasObject[];
  onObjectsChange: (objects: CanvasObject[]) => void;
  activeTool: CanvasTool;
  readOnly: boolean;
}> = ({ objects, onObjectsChange, activeTool, readOnly }) => {
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);

  const [isSpacePressed, setIsSpacePressed] = useState(false);
  
  const stageRef = useRef<any>(null);
  const isPanning = useRef(false);

  // Handle keyboard events for panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(true);
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleWheel = (e: any) => {
    e.evt.preventDefault();

    const scaleBy = 1.05;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const mousePointTo = {
      x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
      y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    
    setStageScale(newScale);
    setStagePos({
      x: -(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale,
      y: -(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale,
    });
  };

  const handleStageMouseDown = (e: any) => {
    if (readOnly) return;

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();

    if (isSpacePressed || activeTool === 'select') {
      isPanning.current = true;
      return;
    }

    // Add new object based on active tool
    if (activeTool !== 'select' as CanvasTool) {
      const newObject: CanvasObject = {
        id: `${activeTool}-${Date.now()}`,
        type: activeTool,
        x: (pos.x - stagePos.x) / stageScale,
        y: (pos.y - stagePos.y) / stageScale,
        width: activeTool === 'text' ? 200 : activeTool === 'sticky' ? 150 : 100,
        height: activeTool === 'text' ? 50 : activeTool === 'sticky' ? 100 : 100,
        fill: activeTool === 'sticky' ? '#fef08a' : '#3b82f6',
        stroke: '#1f2937',
        strokeWidth: 2,
        text: activeTool === 'text' ? 'Edit me' : activeTool === 'sticky' ? 'Sticky note' : undefined,
        fontSize: activeTool === 'sticky' ? 14 : 16,
        points: activeTool === 'connector' ? [0, 0, 100, 100] : undefined,
      };

      onObjectsChange([...objects, newObject]);
    }
  };

  const handleStageMouseMove = (e: any) => {
    if (!isPanning.current) return;

    const stage = e.target.getStage();
    const newPos = {
      x: stagePos.x + stage.getPointerPosition().x - stage.getPointerPosition().x,
      y: stagePos.y + stage.getPointerPosition().y - stage.getPointerPosition().y,
    };
    setStagePos(newPos);
  };

  const handleStageMouseUp = () => {
    isPanning.current = false;
  };

  return (
    <Stage
      ref={stageRef}
      width={window.innerWidth}
      height={window.innerHeight}
      x={stagePos.x}
      y={stagePos.y}
      scaleX={stageScale}
      scaleY={stageScale}
      onWheel={handleWheel}
      onMouseDown={handleStageMouseDown}
      onMouseMove={handleStageMouseMove}
      onMouseUp={handleStageMouseUp}
      draggable={false}
      style={{ cursor: isSpacePressed ? 'grab' : 'default' }}
    >
      <Layer>
        {/* Grid background */}
        {Array.from({ length: 50 }, (_, i) => (
          <Line
            key={`grid-v-${i}`}
            points={[i * 50, 0, i * 50, 2500]}
            stroke="#e5e7eb"
            strokeWidth={0.5}
          />
        ))}
        {Array.from({ length: 50 }, (_, i) => (
          <Line
            key={`grid-h-${i}`}
            points={[0, i * 50, 2500, i * 50]}
            stroke="#e5e7eb"
            strokeWidth={0.5}
          />
        ))}

        {/* Canvas objects */}
        {objects.map((obj) => {
          switch (obj.type) {
            case 'rectangle':
              return (
                <Rect
                  key={obj.id}
                  x={obj.x}
                  y={obj.y}
                  width={obj.width}
                  height={obj.height}
                  fill={obj.fill}
                  stroke={obj.stroke}
                  strokeWidth={obj.strokeWidth}
                  draggable={!readOnly}
                  onClick={() => {/* Object clicked */}}
                />
              );
            case 'circle':
              return (
                <KonvaCircle
                  key={obj.id}
                  x={obj.x}
                  y={obj.y}
                  radius={obj.width ? obj.width / 2 : 50}
                  fill={obj.fill}
                  stroke={obj.stroke}
                  strokeWidth={obj.strokeWidth}
                  draggable={!readOnly}
                  onClick={() => {/* Object clicked */}}
                />
              );
            case 'diamond':
              // Create diamond using a rotated rectangle
              return (
                <Rect
                  key={obj.id}
                  x={obj.x}
                  y={obj.y}
                  width={obj.width}
                  height={obj.height}
                  fill={obj.fill}
                  stroke={obj.stroke}
                  strokeWidth={obj.strokeWidth}
                  rotation={45}
                  offsetX={(obj.width || 100) / 2}
                  offsetY={(obj.height || 100) / 2}
                  draggable={!readOnly}
                  onClick={() => {/* Object clicked */}}
                />
              );
            case 'text':
              return (
                <Text
                  key={obj.id}
                  x={obj.x}
                  y={obj.y}
                  text={obj.text || 'Edit me'}
                  fontSize={obj.fontSize || 16}
                  fill={obj.fill || '#000'}
                  width={obj.width}
                  height={obj.height}
                  draggable={!readOnly}
                  onClick={() => {/* Object clicked */}}
                />
              );
            case 'sticky':
              return (
                <React.Fragment key={obj.id}>
                  {/* Sticky note background */}
                  <Rect
                    x={obj.x}
                    y={obj.y}
                    width={obj.width}
                    height={obj.height}
                    fill={obj.fill || '#fef08a'}
                    stroke="#eab308"
                    strokeWidth={1}
                    cornerRadius={4}
                    draggable={!readOnly}
                    onClick={() => {/* Object clicked */}}
                  />
                  {/* Sticky note text */}
                  <Text
                    x={obj.x + 8}
                    y={obj.y + 8}
                    text={obj.text || 'Sticky note'}
                    fontSize={obj.fontSize || 14}
                    fill="#000"
                    width={(obj.width || 150) - 16}
                    height={(obj.height || 100) - 16}
                    draggable={!readOnly}
                    onClick={() => {/* Object clicked */}}
                  />
                </React.Fragment>
              );
            case 'connector':
              // Simple line connector for now
              return (
                <Line
                  key={obj.id}
                  points={obj.points || [obj.x, obj.y, obj.x + 100, obj.y + 100]}
                  stroke={obj.stroke || '#000'}
                  strokeWidth={obj.strokeWidth || 2}
                  draggable={!readOnly}
                  onClick={() => {/* Object clicked */}}
                />
              );
            default:
              return null;
          }
        })}
      </Layer>
    </Stage>
  );
};