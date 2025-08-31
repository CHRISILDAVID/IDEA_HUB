import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer } from 'react-konva';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../../contexts/AuthContext';
import { WorkspaceToolbar } from './WorkspaceToolbar';
import { WorkspaceCanvas } from './WorkspaceCanvas';
import { WorkspaceHeader } from './WorkspaceHeader';
import { api } from '../../services/api';

export interface WorkspaceElement {
  id: string;
  type: 'rectangle' | 'circle' | 'arrow' | 'text' | 'pen' | 'image';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  rotation?: number;
  opacity: number;
  points?: number[];
  imageUrl?: string;
  startArrowhead?: boolean;
  endArrowhead?: boolean;
}

export interface WorkspaceAppState {
  viewBackgroundColor: string;
  currentItemStrokeColor: string;
  currentItemBackgroundColor: string;
  currentItemFillStyle: string;
  currentItemStrokeWidth: number;
  currentItemRoughness: number;
  currentItemOpacity: number;
  currentItemFontFamily: string;
  currentItemFontSize: number;
  currentItemTextAlign: string;
  currentItemStartArrowhead: boolean;
  currentItemEndArrowhead: boolean;
  scrollX: number;
  scrollY: number;
  zoom: { value: number };
  shouldCacheIgnoreZoom: boolean;
  theme: 'light' | 'dark';
  penMode: boolean;
  activeTool: {
    type: 'selection' | 'rectangle' | 'circle' | 'arrow' | 'text' | 'pen' | 'image';
    locked: boolean;
  };
  penColor: string;
  backgroundColor: string;
  exportBackground: boolean;
  exportEmbedScene: boolean;
  exportWithDarkMode: boolean;
  exportScale: number;
  gridSize: number;
  showGrid: boolean;
  snapToGrid: boolean;
}

interface EraserWorkspaceProps {
  workspaceId?: string;
  onSave?: (elements: WorkspaceElement[], appState: WorkspaceAppState) => void;
  readOnly?: boolean;
  className?: string;
}

export const EraserWorkspace: React.FC<EraserWorkspaceProps> = ({
  workspaceId,
  onSave,
  readOnly = false,
  className = '',
}) => {
  const { user } = useAuth();
  const stageRef = useRef<any>(null);
  
  const [elements, setElements] = useState<WorkspaceElement[]>([]);
  const [appState, setAppState] = useState<WorkspaceAppState>({
    viewBackgroundColor: '#ffffff',
    currentItemStrokeColor: '#1e1e1e',
    currentItemBackgroundColor: 'transparent',
    currentItemFillStyle: 'solid',
    currentItemStrokeWidth: 1,
    currentItemRoughness: 1,
    currentItemOpacity: 100,
    currentItemFontFamily: 'Virgil',
    currentItemFontSize: 20,
    currentItemTextAlign: 'left',
    currentItemStartArrowhead: false,
    currentItemEndArrowhead: true,
    scrollX: 0,
    scrollY: 0,
    zoom: { value: 1 },
    shouldCacheIgnoreZoom: false,
    theme: 'light',
    penMode: false,
    activeTool: {
      type: 'selection',
      locked: false,
    },
    penColor: '#000000',
    backgroundColor: '#ffffff',
    exportBackground: true,
    exportEmbedScene: false,
    exportWithDarkMode: false,
    exportScale: 1,
    gridSize: 20,
    showGrid: true,
    snapToGrid: false,
  });

  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('Untitled Workspace');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Auto-save functionality
  useEffect(() => {
    if (isDirty && !readOnly && workspaceId) {
      const saveTimeout = setTimeout(() => {
        handleSave();
      }, 2000);

      return () => clearTimeout(saveTimeout);
    }
  }, [elements, appState, isDirty, readOnly, workspaceId]);

  // Load workspace data
  useEffect(() => {
    if (workspaceId) {
      loadWorkspace();
    }
  }, [workspaceId]);

  const loadWorkspace = async () => {
    if (!workspaceId) return;
    
    try {
      setIsLoading(true);
      const response = await api.getWorkspace(workspaceId);
      const workspace = response.data;
      
      setWorkspaceName(workspace.name);
      setElements(workspace.content.elements || []);
      setAppState(prev => ({ ...prev, ...workspace.content.appState }));
      setIsDirty(false);
    } catch (error) {
      console.error('Error loading workspace:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!workspaceId || readOnly) return;
    
    try {
      const workspaceData = {
        content: {
          elements,
          appState,
        },
        name: workspaceName,
      };

      if (workspaceId === 'new') {
        // Create new workspace
        const response = await api.createWorkspace(workspaceData);
        // Update URL to reflect the new workspace ID
        window.history.replaceState({}, '', `/workspace/${response.data.id}`);
      } else {
        // Update existing workspace
        await api.updateWorkspace(workspaceId, workspaceData);
      }
      
      setLastSaved(new Date());
      setIsDirty(false);
      
      if (onSave) {
        onSave(elements, appState);
      }
    } catch (error) {
      console.error('Error saving workspace:', error);
    }
  };

  const handleElementsChange = (newElements: WorkspaceElement[]) => {
    setElements(newElements);
    setIsDirty(true);
  };

  const handleAppStateChange = (newAppState: Partial<WorkspaceAppState>) => {
    setAppState(prev => ({ ...prev, ...newAppState }));
    setIsDirty(true);
  };

  const handleToolChange = (tool: WorkspaceAppState['activeTool']['type']) => {
    handleAppStateChange({
      activeTool: { type: tool, locked: false }
    });
  };

  const handleAddElement = (element: Omit<WorkspaceElement, 'id'>) => {
    const newElement: WorkspaceElement = {
      ...element,
      id: uuidv4(),
    };
    handleElementsChange([...elements, newElement]);
  };

  const handleUpdateElement = (id: string, updates: Partial<WorkspaceElement>) => {
    const newElements = elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    );
    handleElementsChange(newElements);
  };

  const handleDeleteElements = (ids: string[]) => {
    const newElements = elements.filter(el => !ids.includes(el.id));
    handleElementsChange(newElements);
    setSelectedElementIds([]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <WorkspaceHeader
        workspaceName={workspaceName}
        onNameChange={setWorkspaceName}
        onSave={handleSave}
        lastSaved={lastSaved}
        isDirty={isDirty}
        readOnly={readOnly}
      />

      {/* Main workspace area */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Toolbar */}
        <WorkspaceToolbar
          activeTool={appState.activeTool.type}
          onToolChange={handleToolChange}
          appState={appState}
          onAppStateChange={handleAppStateChange}
          selectedElements={elements.filter(el => selectedElementIds.includes(el.id))}
          onDeleteSelected={() => handleDeleteElements(selectedElementIds)}
          readOnly={readOnly}
        />

        {/* Canvas */}
        <div className="flex-1 relative">
          <WorkspaceCanvas
            ref={stageRef}
            elements={elements}
            appState={appState}
            selectedElementIds={selectedElementIds}
            onElementsChange={handleElementsChange}
            onAppStateChange={handleAppStateChange}
            onSelectionChange={setSelectedElementIds}
            onAddElement={handleAddElement}
            onUpdateElement={handleUpdateElement}
            readOnly={readOnly}
          />
        </div>
      </div>
    </div>
  );
};