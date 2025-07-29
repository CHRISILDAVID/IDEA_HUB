import React, { useState, useEffect, useRef } from 'react';
import { 
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
  Heading3
} from 'lucide-react';

interface DocumentEditorProps {
  content: string;
  onChange: (content: string) => void;
  readOnly?: boolean;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  content,
  onChange,
  readOnly = false
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const getSelectedText = () => {
    if (!textareaRef.current) return '';
    const { selectionStart, selectionEnd } = textareaRef.current;
    return content.substring(selectionStart, selectionEnd);
  };

  const replaceSelectedText = (newText: string) => {
    if (!textareaRef.current) return;
    
    const { selectionStart, selectionEnd } = textareaRef.current;
    const before = content.substring(0, selectionStart);
    const after = content.substring(selectionEnd);
    const newContent = before + newText + after;
    
    onChange(newContent);
    
    // Restore cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(
          selectionStart + newText.length,
          selectionStart + newText.length
        );
        textareaRef.current.focus();
      }
    }, 0);
  };

  const wrapText = (before: string, after: string = '') => {
    const selectedText = getSelectedText();
    if (selectedText) {
      replaceSelectedText(before + selectedText + after);
    } else {
      // Insert at cursor position
      const { selectionStart } = textareaRef.current!;
      const beforeText = content.substring(0, selectionStart);
      const afterText = content.substring(selectionStart);
      const newContent = beforeText + before + after + afterText;
      onChange(newContent);
      
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(
            selectionStart + before.length,
            selectionStart + before.length
          );
          textareaRef.current.focus();
        }
      }, 0);
    }
  };

  const handleFormat = (format: string) => {
    switch (format) {
      case 'bold':
        wrapText('**', '**');
        break;
      case 'italic':
        wrapText('*', '*');
        break;
      case 'underline':
        wrapText('<u>', '</u>');
        break;
      case 'strikethrough':
        wrapText('~~', '~~');
        break;
      case 'code':
        wrapText('`', '`');
        break;
      case 'quote':
        wrapText('> ');
        break;
      case 'h1':
        wrapText('# ');
        break;
      case 'h2':
        wrapText('## ');
        break;
      case 'h3':
        wrapText('### ');
        break;
      case 'ul':
        wrapText('- ');
        break;
      case 'ol':
        wrapText('1. ');
        break;
      case 'link':
        wrapText('[', '](url)');
        break;
      case 'image':
        wrapText('![alt text](', ')');
        break;
      case 'table':
        const tableText = '\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n';
        replaceSelectedText(tableText);
        break;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const { selectionStart, selectionEnd } = textareaRef.current!;
      const before = content.substring(0, selectionStart);
      const after = content.substring(selectionEnd);
      const newContent = before + '  ' + after;
      onChange(newContent);
      
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(
            selectionStart + 2,
            selectionStart + 2
          );
        }
      }, 0);
    }
  };

  const handleTextareaSelect = () => {
    if (textareaRef.current) {
      const { selectionStart, selectionEnd } = textareaRef.current;
      setSelection({ start: selectionStart, end: selectionEnd });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Floating AI Button */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
        <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200">
          <span className="text-lg">✨</span>
          <span className="font-medium">Generate Outline</span>
          <span className="text-xs opacity-75">Ctrl ⇧ J</span>
        </button>
      </div>

      {/* Editor */}
      <div className="flex-1 p-6">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onSelect={handleTextareaSelect}
          onKeyDown={handleKeyDown}
          readOnly={readOnly}
          placeholder="Type your notes or document here — style with markdown or shortcuts (Ctrl/)"
          className="w-full h-full resize-none bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-base leading-relaxed font-mono"
          style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace' }}
        />
      </div>
    </div>
  );
}; 