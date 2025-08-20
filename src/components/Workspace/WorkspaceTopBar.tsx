import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, User, Save, Loader2 } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { useAuth } from '../../contexts/AuthContext';
import { IdeaName } from './IdeaName';
import { ViewToggle } from './ViewToggle';

interface WorkspaceTopBarProps {
  onSave: () => void;
}

export const WorkspaceTopBar: React.FC<WorkspaceTopBarProps> = ({ onSave }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isSaving, lastSaved } = useAppSelector(state => state.workspace);
  const { isDirty } = useAppSelector(state => state.idea);

  const handleShare = async () => {
    try {
      await navigator.share({
        title: 'Check out this idea on IdeaHub',
        url: window.location.href,
      });
    } catch (error) {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const formatLastSaved = (timestamp: string | null) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return `Saved ${date.toLocaleTimeString()}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <IdeaName />
        </div>

        {/* Center Section */}
        <div className="flex items-center space-x-4">
          <ViewToggle />
          
          {/* Save Status */}
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-2">
            {isSaving ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Saving...</span>
              </>
            ) : isDirty ? (
              <span>Unsaved changes</span>
            ) : lastSaved ? (
              <span>{formatLastSaved(lastSaved)}</span>
            ) : null}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onSave}
            disabled={isSaving || !isDirty}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
          
          <button
            onClick={handleShare}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium flex items-center space-x-2"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
          
          {user && (
            <img
              src={user.avatar || `https://ui-avatars.com/api/?name=${user.fullName}&background=random`}
              alt={user.fullName}
              className="w-8 h-8 rounded-full object-cover"
            />
          )}
        </div>
      </div>
    </div>
  );
};