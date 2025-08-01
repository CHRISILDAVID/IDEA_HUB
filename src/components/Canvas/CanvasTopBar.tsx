import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Undo2,
  Redo2,
  Group,
  Ungroup,
  Copy,
  Trash2,
  Save,
  Share2
} from 'lucide-react';

interface CanvasTopBarProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onGroup: () => void;
  onUngroup: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onSave: () => void;
  onShare: () => void;
  canUndo: boolean;
  canRedo: boolean;
  canGroup: boolean;
  canUngroup: boolean;
  canCopy: boolean;
  canDelete: boolean;
  saving?: boolean;
}

export const CanvasTopBar: React.FC<CanvasTopBarProps> = ({
  scale,
  onZoomIn,
  onZoomOut,
  onResetView,
  onUndo,
  onRedo,
  onGroup,
  onUngroup,
  onCopy,
  onDelete,
  onSave,
  onShare,
  canUndo,
  canRedo,
  canGroup,
  canUngroup,
  canCopy,
  canDelete,
  saving = false
}) => {
  return (
    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {/* Left Section - Zoom Controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onZoomOut}
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        
        <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[60px] text-center font-medium">
          {Math.round(scale * 100)}%
        </span>
        
        <button
          onClick={onZoomIn}
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        
        <button
          onClick={onResetView}
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Center Section - History Controls */}
      <div className="flex items-center space-x-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-2 rounded transition-colors ${
            canUndo 
              ? 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700' 
              : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
          }`}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`p-2 rounded transition-colors ${
            canRedo 
              ? 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700' 
              : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
          }`}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      {/* Right Section - Object Controls & Actions */}
      <div className="flex items-center space-x-1">
        {/* Object Controls */}
        <div className="flex items-center space-x-1 mr-4">
          <button
            onClick={onGroup}
            disabled={!canGroup}
            className={`p-2 rounded transition-colors ${
              canGroup 
                ? 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700' 
                : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
            }`}
            title="Group Objects (Ctrl+G)"
          >
            <Group className="w-4 h-4" />
          </button>
          
          <button
            onClick={onUngroup}
            disabled={!canUngroup}
            className={`p-2 rounded transition-colors ${
              canUngroup 
                ? 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700' 
                : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
            }`}
            title="Ungroup Objects (Ctrl+Shift+G)"
          >
            <Ungroup className="w-4 h-4" />
          </button>
          
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2" />
          
          <button
            onClick={onCopy}
            disabled={!canCopy}
            className={`p-2 rounded transition-colors ${
              canCopy 
                ? 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700' 
                : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
            }`}
            title="Copy (Ctrl+C)"
          >
            <Copy className="w-4 h-4" />
          </button>
          
          <button
            onClick={onDelete}
            disabled={!canDelete}
            className={`p-2 rounded transition-colors ${
              canDelete 
                ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20' 
                : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
            }`}
            title="Delete (Delete)"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onSave}
            disabled={saving}
            className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
              saving
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          
          <button
            onClick={onShare}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium flex items-center space-x-1"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
}; 