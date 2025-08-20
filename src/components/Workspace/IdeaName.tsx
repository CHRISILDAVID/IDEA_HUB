import React, { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setTitle } from '../../store/slices/ideaSlice';
import { Edit3 } from 'lucide-react';

export const IdeaName: React.FC = () => {
  const dispatch = useAppDispatch();
  const { title } = useAppSelector(state => state.idea);
  const [isEditing, setIsEditing] = useState(false);
  const [localTitle, setLocalTitle] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalTitle(title);
  }, [title]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (localTitle.trim() && localTitle !== title) {
      dispatch(setTitle(localTitle.trim()));
    } else {
      setLocalTitle(title);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalTitle(title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center space-x-2 max-w-sm">
        <input
          ref={inputRef}
          type="text"
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="text-lg font-semibold text-gray-900 dark:text-white bg-transparent border-b-2 border-blue-500 outline-none min-w-0 flex-1"
          placeholder="Untitled Idea"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 group max-w-sm">
      <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
        {title || 'Untitled Idea'}
      </h1>
      <button
        onClick={handleStartEdit}
        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
      >
        <Edit3 className="w-4 h-4" />
      </button>
    </div>
  );
};