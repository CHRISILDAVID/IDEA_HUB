import React, { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setDocumentContent, setTitle } from '../../store/slices/ideaSlice';
import { setActiveEditor } from '../../store/slices/workspaceSlice';

export const DocumentEditor: React.FC = () => {
  const dispatch = useAppDispatch();
  const { documentContent, title } = useAppSelector(state => state.idea);
  const { activeEditor } = useAppSelector(state => state.workspace);
  
  const [localTitle, setLocalTitle] = useState(title);
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const isUpdatingRef = useRef(false);

  // Extract body content (everything except the title)
  const getBodyContent = (content: string): string => {
    if (!content) return '';
    
    // Remove the first h1 heading and any following empty lines
    const lines = content.split('\n');
    let startIndex = 0;
    
    // Find the first non-title line
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('# ')) {
        startIndex = i + 1;
        // Skip any empty lines after title
        while (startIndex < lines.length && lines[startIndex].trim() === '') {
          startIndex++;
        }
        break;
      }
    }
    
    return lines.slice(startIndex).join('\n');
  };

  const [bodyContent, setBodyContent] = useState(getBodyContent(documentContent));

  const bodyEditor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4, 5, 6], // Exclude h1 from body
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing your idea...',
      }),
    ],
    content: bodyContent,
    onUpdate: ({ editor }) => {
      if (isUpdatingRef.current) return;
      
      const newBodyContent = editor.getHTML();
      setBodyContent(newBodyContent);
      
      // Combine title and body content
      const combinedContent = title ? `# ${title}\n\n${newBodyContent}` : newBodyContent;
      
      isUpdatingRef.current = true;
      dispatch(setDocumentContent(combinedContent));
      setTimeout(() => { isUpdatingRef.current = false; }, 0);
    },
    onFocus: () => {
      dispatch(setActiveEditor('document'));
    },
    editorProps: {
      attributes: {
        class: 'prose prose-gray dark:prose-invert max-w-none focus:outline-none h-full p-6 pt-4 overflow-auto',
      },
    },
  });

  // Handle title changes
  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newTitle = e.target.value;
    setLocalTitle(newTitle);
    
    if (!isUpdatingRef.current) {
      isUpdatingRef.current = true;
      dispatch(setTitle(newTitle));
      
      // Update combined content
      const combinedContent = newTitle ? `# ${newTitle}\n\n${bodyContent}` : bodyContent;
      dispatch(setDocumentContent(combinedContent));
      setTimeout(() => { isUpdatingRef.current = false; }, 0);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      bodyEditor?.commands.focus();
    }
  };

  // Auto-resize title textarea
  const autoResizeTitle = () => {
    if (titleRef.current) {
      titleRef.current.style.height = 'auto';
      titleRef.current.style.height = titleRef.current.scrollHeight + 'px';
    }
  };

  // Update local state when Redux state changes (from external sources)
  useEffect(() => {
    if (!isUpdatingRef.current && title !== localTitle && !isTitleFocused) {
      setLocalTitle(title);
    }
  }, [title, localTitle, isTitleFocused]);

  useEffect(() => {
    if (!isUpdatingRef.current) {
      const newBodyContent = getBodyContent(documentContent);
      if (newBodyContent !== bodyContent) {
        setBodyContent(newBodyContent);
        bodyEditor?.commands.setContent(newBodyContent);
      }
    }
  }, [documentContent, bodyEditor, bodyContent]);

  // Auto-resize title on content change
  useEffect(() => {
    autoResizeTitle();
  }, [localTitle]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div 
        className={`flex-1 flex flex-col overflow-hidden ${
          activeEditor === 'document' ? 'ring-2 ring-blue-500 ring-inset' : ''
        }`}
        onClick={() => dispatch(setActiveEditor('document'))}
      >
        {/* Title Section */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
          <textarea
            ref={titleRef}
            value={localTitle}
            onChange={handleTitleChange}
            onKeyDown={handleTitleKeyDown}
            onFocus={() => {
              setIsTitleFocused(true);
              dispatch(setActiveEditor('document'));
            }}
            onBlur={() => setIsTitleFocused(false)}
            placeholder="Enter your idea title..."
            className="w-full px-6 py-6 text-3xl font-bold text-gray-900 dark:text-white bg-transparent border-none outline-none resize-none overflow-hidden leading-tight"
            style={{ 
              minHeight: '3.5rem',
              maxHeight: '8rem' // Limit title height
            }}
            rows={1}
          />
        </div>

        {/* Body Content Section */}
        <div className="flex-1 bg-white dark:bg-gray-800 overflow-hidden">
          <EditorContent 
            editor={bodyEditor} 
            className="h-full overflow-auto"
          />
        </div>
      </div>
    </div>
  );
};