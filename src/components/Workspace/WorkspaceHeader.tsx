import React, { useState } from 'react';
import { 
  Save, 
  Share2, 
  Users, 
  Download, 
  Upload, 
  Settings,
  Edit3,
  Check,
  X,
  Loader2
} from 'lucide-react';

interface WorkspaceHeaderProps {
  workspaceName: string;
  onNameChange: (name: string) => void;
  onSave: () => void;
  lastSaved: Date | null;
  isDirty: boolean;
  readOnly?: boolean;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  workspaceName,
  onNameChange,
  onSave,
  lastSaved,
  isDirty,
  readOnly = false,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(workspaceName);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveName = () => {
    if (tempName.trim()) {
      onNameChange(tempName.trim());
    } else {
      setTempName(workspaceName);
    }
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setTempName(workspaceName);
    setIsEditingName(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave();
    } finally {
      setIsSaving(false);
    }
  };

  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Saved just now';
    if (diffMins < 60) return `Saved ${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Saved ${diffHours}h ago`;
    
    return `Saved ${date.toLocaleDateString()}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left section - Workspace name */}
        <div className="flex items-center space-x-4">
          {isEditingName ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
                className="text-lg font-semibold bg-transparent border-b-2 border-blue-500 outline-none text-gray-900 dark:text-white"
                autoFocus
              />
              <button
                onClick={handleSaveName}
                className="p-1 text-green-600 hover:text-green-700"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancelEdit}
                className="p-1 text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 group">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {workspaceName}
              </h1>
              {!readOnly && (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
          
          {/* Save status */}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {isSaving ? (
              <div className="flex items-center space-x-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Saving...</span>
              </div>
            ) : isDirty ? (
              <span>Unsaved changes</span>
            ) : lastSaved ? (
              <span>{formatLastSaved(lastSaved)}</span>
            ) : null}
          </div>
        </div>

        {/* Right section - Actions */}
        <div className="flex items-center space-x-2">
          {!readOnly && (
            <>
              <button
                onClick={handleSave}
                disabled={!isDirty || isSaving}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Save</span>
              </button>

              <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>

              <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Collaborate</span>
              </button>
            </>
          )}

          <div className="flex items-center space-x-1">
            <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <Download className="w-4 h-4" />
            </button>
            
            {!readOnly && (
              <>
                <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <Upload className="w-4 h-4" />
                </button>
                
                <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <Settings className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};