import React from 'react';
import {
  MousePointer,
  Square,
  Circle,
  Type,
  Pen,
  Image,
  Trash2,
  Copy,
  Undo2,
  Redo2
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setActiveTool, CanvasTool } from '../../store/slices/workspaceSlice';
import { deleteCanvasObject } from '../../store/slices/ideaSlice';
import { undo, redo, executeCommand } from '../../store/slices/historySlice';
import { v4 as uuidv4 } from 'uuid';

export const CanvasToolbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { activeTool } = useAppSelector(state => state.workspace);
  const { selectedObjectId, canvasObjects } = useAppSelector(state => state.idea);
  const { undoStack, redoStack } = useAppSelector(state => state.history);

  const tools: { tool: CanvasTool; icon: React.ComponentType<any>; label: string }[] = [
    { tool: 'select', icon: MousePointer, label: 'Select' },
    { tool: 'rectangle', icon: Square, label: 'Rectangle' },
    { tool: 'circle', icon: Circle, label: 'Circle' },
    { tool: 'text', icon: Type, label: 'Text' },
    { tool: 'pen', icon: Pen, label: 'Pen' },
    { tool: 'image', icon: Image, label: 'Image' },
  ];

  const handleDeleteSelected = () => {
    if (!selectedObjectId) return;
    
    const objectToDelete = canvasObjects.find(obj => obj.id === selectedObjectId);
    if (!objectToDelete) return;

    const deleteCommand = {
      id: uuidv4(),
      type: 'deleteCanvasObject',
      execute: () => dispatch(deleteCanvasObject(selectedObjectId)),
      undo: () => dispatch(addCanvasObject(objectToDelete)),
      description: `Delete ${objectToDelete.type}`,
      timestamp: Date.now(),
    };

    dispatch(executeCommand(deleteCommand));
  };

  const handleCopySelected = () => {
    if (!selectedObjectId) return;
    
    const objectToCopy = canvasObjects.find(obj => obj.id === selectedObjectId);
    if (!objectToCopy) return;

    const copiedObject = {
      ...objectToCopy,
      id: uuidv4(),
      x: objectToCopy.x + 20,
      y: objectToCopy.y + 20,
    };

    const copyCommand = {
      id: uuidv4(),
      type: 'copyCanvasObject',
      execute: () => dispatch(addCanvasObject(copiedObject)),
      undo: () => dispatch(deleteCanvasObject(copiedObject.id)),
      description: `Copy ${objectToCopy.type}`,
      timestamp: Date.now(),
    };

    dispatch(executeCommand(copyCommand));
  };

  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20">
      <div className="flex flex-col items-center bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1 space-y-1">
        {/* History Controls */}
        <button
          onClick={() => dispatch(undo())}
          disabled={undoStack.length === 0}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => dispatch(redo())}
          disabled={redoStack.length === 0}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="w-6 h-px bg-gray-200 dark:bg-gray-700" />

        {/* Tools */}
        {tools.map(({ tool, icon: Icon, label }) => (
          <button
            key={tool}
            onClick={() => dispatch(setActiveTool(tool))}
            className={`p-2 rounded transition-colors ${
              activeTool === tool
                ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title={label}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}

        <div className="w-6 h-px bg-gray-200 dark:bg-gray-700" />

        {/* Object Actions */}
        <button
          onClick={handleCopySelected}
          disabled={!selectedObjectId}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Copy (Ctrl+C)"
        >
          <Copy className="w-4 h-4" />
        </button>
        
        <button
          onClick={handleDeleteSelected}
          disabled={!selectedObjectId}
          className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Delete (Del)"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};