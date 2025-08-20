import React from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  List, 
  ListOrdered, 
  Code, 
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Undo2,
  Redo2
} from 'lucide-react';
import { useEditor } from '@tiptap/react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { undo, redo } from '../../store/slices/historySlice';

export const DocumentToolbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { activeEditor } = useAppSelector(state => state.workspace);
  const { undoStack, redoStack } = useAppSelector(state => state.history);

  // Get the editor instance from context (we'll need to pass it down)
  // For now, we'll create toolbar buttons that work with TipTap commands

  const toolbarButtons = [
    { 
      icon: Bold, 
      label: 'Bold', 
      action: 'bold',
      shortcut: 'Ctrl+B'
    },
    { 
      icon: Italic, 
      label: 'Italic', 
      action: 'italic',
      shortcut: 'Ctrl+I'
    },
    { 
      icon: Underline, 
      label: 'Underline', 
      action: 'underline',
      shortcut: 'Ctrl+U'
    },
    { 
      icon: Strikethrough, 
      label: 'Strikethrough', 
      action: 'strike',
      shortcut: 'Ctrl+Shift+X'
    },
    { 
      icon: Code, 
      label: 'Code', 
      action: 'code',
      shortcut: 'Ctrl+E'
    },
    { 
      icon: Heading1, 
      label: 'Heading 1', 
      action: 'heading1',
      shortcut: 'Ctrl+Alt+1'
    },
    { 
      icon: Heading2, 
      label: 'Heading 2', 
      action: 'heading2',
      shortcut: 'Ctrl+Alt+2'
    },
    { 
      icon: Heading3, 
      label: 'Heading 3', 
      action: 'heading3',
      shortcut: 'Ctrl+Alt+3'
    },
    { 
      icon: List, 
      label: 'Bullet List', 
      action: 'bulletList',
      shortcut: 'Ctrl+Shift+8'
    },
    { 
      icon: ListOrdered, 
      label: 'Numbered List', 
      action: 'orderedList',
      shortcut: 'Ctrl+Shift+7'
    },
    { 
      icon: Quote, 
      label: 'Quote', 
      action: 'blockquote',
      shortcut: 'Ctrl+Shift+B'
    },
  ];

  const handleUndo = () => {
    if (activeEditor === 'document') {
      // Let TipTap handle its own undo for document
      // dispatch(undo());
    } else {
      dispatch(undo());
    }
  };

  const handleRedo = () => {
    if (activeEditor === 'document') {
      // Let TipTap handle its own redo for document
      // dispatch(redo());
    } else {
      dispatch(redo());
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-1">
        {/* History Controls */}
        <button
          onClick={handleUndo}
          disabled={activeEditor === 'document' ? false : undoStack.length === 0}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        
        <button
          onClick={handleRedo}
          disabled={activeEditor === 'document' ? false : redoStack.length === 0}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />

        {/* Formatting Controls */}
        {toolbarButtons.map((button, index) => {
          const Icon = button.icon;
          return (
            <React.Fragment key={button.action}>
              <button
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={`${button.label} (${button.shortcut})`}
              >
                <Icon className="w-4 h-4" />
              </button>
              {(index === 4 || index === 7) && (
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};