import React, { useState } from 'react';
import {
  MousePointer,
  Square,
  Circle,
  ArrowRight,
  Type,
  Pen,
  Image,
  Trash2,
  Copy,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Grid,
  Palette,
  Settings
} from 'lucide-react';
import { WorkspaceElement, WorkspaceAppState } from './EraserWorkspace';

interface WorkspaceToolbarProps {
  activeTool: WorkspaceAppState['activeTool']['type'];
  onToolChange: (tool: WorkspaceAppState['activeTool']['type']) => void;
  appState: WorkspaceAppState;
  onAppStateChange: (updates: Partial<WorkspaceAppState>) => void;
  selectedElements: WorkspaceElement[];
  onDeleteSelected: () => void;
  readOnly?: boolean;
}

export const WorkspaceToolbar: React.FC<WorkspaceToolbarProps> = ({
  activeTool,
  onToolChange,
  appState,
  onAppStateChange,
  selectedElements,
  onDeleteSelected,
  readOnly = false,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const tools = [
    { type: 'selection' as const, icon: MousePointer, label: 'Select', shortcut: 'V' },
    { type: 'rectangle' as const, icon: Square, label: 'Rectangle', shortcut: 'R' },
    { type: 'circle' as const, icon: Circle, label: 'Circle', shortcut: 'O' },
    { type: 'arrow' as const, icon: ArrowRight, label: 'Arrow', shortcut: 'A' },
    { type: 'text' as const, icon: Type, label: 'Text', shortcut: 'T' },
    { type: 'pen' as const, icon: Pen, label: 'Pen', shortcut: 'P' },
    { type: 'image' as const, icon: Image, label: 'Image', shortcut: 'I' },
  ];

  const colors = [
    '#000000', '#ffffff', '#e03131', '#2f9e44', '#1971c2', '#f08c00',
    '#ae3ec9', '#495057', '#868e96', '#fa5252', '#51cf66', '#339af0',
    '#ff922b', '#c92a2a', '#37b24d', '#1864ab', '#fd7e14', '#862e9c'
  ];

  const handleZoomIn = () => {
    const newZoom = Math.min(appState.zoom.value * 1.2, 5);
    onAppStateChange({ zoom: { value: newZoom } });
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(appState.zoom.value / 1.2, 0.1);
    onAppStateChange({ zoom: { value: newZoom } });
  };

  const handleResetZoom = () => {
    onAppStateChange({ zoom: { value: 1 } });
  };

  return (
    <div className="w-16 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-4 space-y-2">
      {/* Tools */}
      <div className="space-y-1">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.type}
              onClick={() => !readOnly && onToolChange(tool.type)}
              disabled={readOnly}
              className={`p-2 rounded-lg transition-colors relative group ${
                activeTool === tool.type
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
              } ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={`${tool.label} (${tool.shortcut})`}
            >
              <Icon className="w-5 h-5" />
              
              {/* Tooltip */}
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {tool.label} ({tool.shortcut})
              </div>
            </button>
          );
        })}
      </div>

      <div className="w-8 h-px bg-gray-200 dark:bg-gray-700" />

      {/* Color picker */}
      <div className="relative">
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="p-2 rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
          title="Colors"
        >
          <div className="w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600" style={{ backgroundColor: appState.currentItemStrokeColor }}>
            <div className="w-full h-2 rounded-t" style={{ backgroundColor: appState.currentItemBackgroundColor }} />
          </div>
        </button>

        {showColorPicker && (
          <div className="absolute left-full ml-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg z-50">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Stroke
                </label>
                <div className="grid grid-cols-6 gap-1">
                  {colors.map((color) => (
                    <button
                      key={`stroke-${color}`}
                      onClick={() => onAppStateChange({ currentItemStrokeColor: color })}
                      className={`w-6 h-6 rounded border-2 ${
                        appState.currentItemStrokeColor === color
                          ? 'border-blue-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fill
                </label>
                <div className="grid grid-cols-6 gap-1">
                  <button
                    onClick={() => onAppStateChange({ currentItemBackgroundColor: 'transparent' })}
                    className={`w-6 h-6 rounded border-2 bg-white ${
                      appState.currentItemBackgroundColor === 'transparent'
                        ? 'border-blue-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    title="Transparent"
                  >
                    <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-500 opacity-20 rounded" style={{ background: 'linear-gradient(45deg, transparent 40%, red 40%, red 60%, transparent 60%)' }} />
                  </button>
                  {colors.map((color) => (
                    <button
                      key={`fill-${color}`}
                      onClick={() => onAppStateChange({ currentItemBackgroundColor: color })}
                      className={`w-6 h-6 rounded border-2 ${
                        appState.currentItemBackgroundColor === color
                          ? 'border-blue-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="w-8 h-px bg-gray-200 dark:bg-gray-700" />

      {/* Actions */}
      <div className="space-y-1">
        <button
          onClick={() => {/* TODO: Implement undo */}}
          className="p-2 rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => {/* TODO: Implement redo */}}
          className="p-2 rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        {!readOnly && selectedElements.length > 0 && (
          <>
            <button
              onClick={() => {/* TODO: Implement copy */}}
              className="p-2 rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
              title="Copy (Ctrl+C)"
            >
              <Copy className="w-4 h-4" />
            </button>
            
            <button
              onClick={onDeleteSelected}
              className="p-2 rounded-lg transition-colors text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300"
              title="Delete (Del)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      <div className="w-8 h-px bg-gray-200 dark:bg-gray-700" />

      {/* Zoom controls */}
      <div className="space-y-1">
        <button
          onClick={handleZoomIn}
          className="p-2 rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        
        <button
          onClick={handleResetZoom}
          className="p-1 rounded text-xs font-mono text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
          title="Reset Zoom"
        >
          {Math.round(appState.zoom.value * 100)}%
        </button>
        
        <button
          onClick={handleZoomOut}
          className="p-2 rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>

      <div className="w-8 h-px bg-gray-200 dark:bg-gray-700" />

      {/* Settings */}
      <div className="relative">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {showSettings && (
          <div className="absolute left-full ml-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg z-50 w-48">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Show Grid</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={appState.showGrid}
                    onChange={(e) => onAppStateChange({ showGrid: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Snap to Grid</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={appState.snapToGrid}
                    onChange={(e) => onAppStateChange({ snapToGrid: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Stroke Width
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={appState.currentItemStrokeWidth}
                  onChange={(e) => onAppStateChange({ currentItemStrokeWidth: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  {appState.currentItemStrokeWidth}px
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Opacity
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={appState.currentItemOpacity}
                  onChange={(e) => onAppStateChange({ currentItemOpacity: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  {appState.currentItemOpacity}%
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};