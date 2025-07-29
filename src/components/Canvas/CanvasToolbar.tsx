import React from 'react';
import { 
  Plus,
  Wand2,
  MousePointer,
  Square,
  Circle,
  Diamond,
  Minus,
  Type,
  Image,
  MessageSquare,
  Slash
} from 'lucide-react';

export const CanvasToolbar: React.FC = () => {
  return (
    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
      <div className="flex flex-col space-y-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2">
        <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative group">
          <Plus className="w-5 h-5" />
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Press / to open insert menu
          </div>
        </button>
        
        <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <Wand2 className="w-5 h-5" />
        </button>
        
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-auto" />
        
        <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <MousePointer className="w-5 h-5" />
        </button>
        
        <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <Square className="w-5 h-5" />
        </button>
        
        <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <Circle className="w-5 h-5" />
        </button>
        
        <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <Diamond className="w-5 h-5" />
        </button>
        
        <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <Minus className="w-5 h-5" />
        </button>
        
        <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <Type className="w-5 h-5" />
        </button>
        
        <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <Image className="w-5 h-5" />
        </button>
        
        <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}; 