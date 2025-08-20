import React, { useEffect } from 'react';
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

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading' && node.attrs.level === 1) {
            return 'Enter your idea title...';
          }
          return 'Start writing your idea...';
        },
      }),
    ],
    content: documentContent,
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      dispatch(setDocumentContent(content));
      
      // Extract title from first heading
      const firstHeading = editor.getJSON().content?.find(
        node => node.type === 'heading' && node.attrs?.level === 1
      );
      
      if (firstHeading?.content?.[0]?.text) {
        const newTitle = firstHeading.content[0].text;
        if (newTitle !== title) {
          dispatch(setTitle(newTitle));
        }
      }
    },
    onFocus: () => {
      dispatch(setActiveEditor('document'));
    },
    editorProps: {
      attributes: {
        class: 'prose prose-gray dark:prose-invert max-w-none focus:outline-none min-h-full p-6',
      },
    },
  });

  // Update editor content when Redux state changes (but not from editor itself)
  useEffect(() => {
    if (editor && editor.getHTML() !== documentContent) {
      editor.commands.setContent(documentContent);
    }
  }, [documentContent, editor]);

  // Ensure first line is always a heading
  useEffect(() => {
    if (editor && title) {
      const currentContent = editor.getJSON();
      const firstNode = currentContent.content?.[0];
      
      if (!firstNode || firstNode.type !== 'heading' || firstNode.attrs?.level !== 1) {
        // Insert title as first heading if it doesn't exist
        editor.commands.insertContentAt(0, {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: title }],
        });
      }
    }
  }, [editor, title]);

  return (
    <div className="flex-1 flex flex-col">
      <div 
        className={`flex-1 overflow-auto ${
          activeEditor === 'document' ? 'ring-2 ring-blue-500 ring-inset' : ''
        }`}
        onClick={() => dispatch(setActiveEditor('document'))}
      >
        <EditorContent 
          editor={editor} 
          className="h-full"
        />
      </div>
    </div>
  );
};