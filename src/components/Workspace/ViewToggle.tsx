import React from 'react';
import { FileText, Layout, Palette } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setViewMode, ViewMode } from '../../store/slices/workspaceSlice';

export const ViewToggle: React.FC = () => {
  const dispatch = useAppDispatch();
  const { viewMode } = useAppSelector(state => state.workspace);

  const views: { mode: ViewMode; label: string; icon: React.ComponentType<any> }[] = [
    { mode: 'document', label: 'Document', icon: FileText },
    { mode: 'both', label: 'Both', icon: Layout },
    { mode: 'canvas', label: 'Canvas', icon: Palette },
  ];

  return (
    <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
      {views.map(({ mode, label, icon: Icon }) => (
        <button
          key={mode}
          onClick={() => dispatch(setViewMode(mode))}
          className={`flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            viewMode === mode
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Icon className="w-4 h-4" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
};