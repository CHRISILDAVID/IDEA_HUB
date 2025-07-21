import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Idea } from '../../types';

interface ForkButtonProps {
  idea: Idea;
  className?: string;
}

export const ForkButton: React.FC<ForkButtonProps> = ({
  idea,
  className = '',
}) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState(`${idea.title} - variation`);
  const [description, setDescription] = useState(idea.description || '');
  const [error, setError] = useState('');

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setError('');
  };

  const handleFork = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // Use the fork_idea RPC
      const { data: newIdeaId, error } = await supabase.rpc('fork_idea', {
        parent_idea_id: idea.id,
        new_title: title,
        new_description: description
      });

      if (error) {
        throw error;
      }

      // Close modal
      handleCloseModal();
      
      // Navigate to the new idea's page
      navigate(`/idea/${newIdeaId}`);
    } catch (err: any) {
      console.error('Failed to fork idea:', err);
      setError(err.message || 'Failed to fork idea');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        className={`flex items-center gap-1 ${className}`}
        aria-label="Fork this idea"
        title="Fork this idea"
      >
        <span>Fork ⑂</span>
        <span>{idea.forks}</span>
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              aria-label="Close"
            >
              ✕
            </button>
            
            <h2 className="text-2xl font-bold mb-4">Create Variation</h2>
            
            <form onSubmit={handleFork}>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}
              
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium mb-1">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="description" className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 h-32"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border rounded"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating...' : 'Create Variation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
