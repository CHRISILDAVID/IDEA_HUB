import React from 'react';
import { 
  Plus,
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  List, 
  ListOrdered, 
  Code, 
  Table, 
  Link, 
  Image as ImageIcon,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  HelpCircle
} from 'lucide-react';

interface DocumentToolbarProps {
  onContentChange: (content: string) => void;
  onSave: () => void;
  saving?: boolean;
}

export const DocumentToolbar: React.FC<DocumentToolbarProps> = ({
  onContentChange,
  onSave,
  saving = false
}) => {
  const handleFormat = (format: string) => {
    // This will be handled by the DocumentEditor component
    // The toolbar just provides the UI
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-1">
        <button className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <Plus className="w-2.5 h-2.5" />
        </button>
        
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />
        
        <button 
          onClick={() => handleFormat('bold')}
          className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-2.5 h-2.5" />
        </button>
        
        <button 
          onClick={() => handleFormat('italic')}
          className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-2.5 h-2.5" />
        </button>
        
        <button 
          onClick={() => handleFormat('underline')}
          className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Underline (Ctrl+U)"
        >
          <Underline className="w-2.5 h-2.5" />
        </button>
        
        <button 
          onClick={() => handleFormat('strikethrough')}
          className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Strikethrough"
        >
          <Strikethrough className="w-2.5 h-2.5" />
        </button>
        
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />
        
        <button 
          onClick={() => handleFormat('ul')}
          className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Unordered List"
        >
          <List className="w-2.5 h-2.5" />
        </button>
        
        <button 
          onClick={() => handleFormat('ol')}
          className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Ordered List"
        >
          <ListOrdered className="w-2.5 h-2.5" />
        </button>
        
        <button 
          onClick={() => handleFormat('code')}
          className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Code Block"
        >
          <Code className="w-2.5 h-2.5" />
        </button>
        
        <button 
          onClick={() => handleFormat('table')}
          className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Insert Table"
        >
          <Table className="w-2.5 h-2.5" />
        </button>
        
        <button 
          onClick={() => handleFormat('link')}
          className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Insert Link"
        >
          <Link className="w-2.5 h-2.5" />
        </button>
        
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />
        
        <button 
          onClick={() => handleFormat('h1')}
          className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Heading 1"
        >
          <Heading1 className="w-2.5 h-2.5" />
        </button>
        
        <button 
          onClick={() => handleFormat('h2')}
          className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Heading 2"
        >
          <Heading2 className="w-2.5 h-2.5" />
        </button>
        
        <button 
          onClick={() => handleFormat('h3')}
          className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Heading 3"
        >
          <Heading3 className="w-2.5 h-2.5" />
        </button>
        
        <button 
          onClick={() => handleFormat('quote')}
          className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Quote"
        >
          <Quote className="w-2.5 h-2.5" />
        </button>
      </div>
      
      <div className="flex items-center space-x-2">
        <button className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <HelpCircle className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  );
}; 