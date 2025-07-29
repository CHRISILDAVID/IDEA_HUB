import React from 'react';

type ViewMode = 'document' | 'both' | 'canvas';

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({
  currentView,
  onViewChange
}) => {
  return (
    <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
      <button
        onClick={() => onViewChange('document')}
        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
          currentView === 'document'
            ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        Document
      </button>
      <button
        onClick={() => onViewChange('both')}
        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
          currentView === 'both'
            ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        Both
      </button>
      <button
        onClick={() => onViewChange('canvas')}
        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
          currentView === 'canvas'
            ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        Canvas
      </button>
    </div>
  );
}; 