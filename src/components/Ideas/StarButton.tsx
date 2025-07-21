import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface StarButtonProps {
  ideaId: string;
  initialStarCount: number;
  isInitiallyStarred: boolean;
  className?: string;
}

export const StarButton: React.FC<StarButtonProps> = ({
  ideaId,
  initialStarCount,
  isInitiallyStarred,
  className = '',
}) => {
  const [isStarred, setIsStarred] = useState(isInitiallyStarred);
  const [starCount, setStarCount] = useState(initialStarCount);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleStar = async () => {
    try {
      setIsLoading(true);
      
      // Use the toggle_star RPC
      const { data, error } = await supabase.rpc('toggle_star', {
        idea_id_to_toggle: ideaId
      });

      if (error) {
        console.error('Error toggling star:', error);
        return;
      }

      // Update local state based on the response
      setIsStarred(data.is_starred);
      setStarCount(prev => data.is_starred ? prev + 1 : prev - 1);
    } catch (error) {
      console.error('Failed to toggle star:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleStar}
      disabled={isLoading}
      className={`flex items-center gap-1 transition-colors ${className}`}
      aria-label={isStarred ? "Unstar this idea" : "Star this idea"}
      title={isStarred ? "Unstar this idea" : "Star this idea"}
    >
      <span className={`text-lg ${isStarred ? 'text-yellow-500' : 'text-gray-400'}`}>
        {isStarred ? '★' : '☆'}
      </span>
      <span>{starCount}</span>
    </button>
  );
};
