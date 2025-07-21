import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Clock, Eye, GitFork } from 'lucide-react';
import { Idea } from '../../types';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { StarButton } from './StarButton';
import { ForkButton } from './ForkButton';

interface IdeaCardProps {
  idea: Idea;
  onUpdate?: (idea: Idea) => void;
}

export const IdeaCard: React.FC<IdeaCardProps> = ({ idea, onUpdate }) => {
  const { checkAuthForAction } = useAuthGuard();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return `${Math.ceil(diffDays / 365)} years ago`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <Link to={`/profile/${idea.author.username}`}>
              <img
                src={idea.author.avatar || `https://ui-avatars.com/api/?name=${idea.author.fullName}&background=random`}
                alt={idea.author.fullName}
                className="w-8 h-8 rounded-full object-cover"
              />
            </Link>
            <div>
              <Link 
                to={`/profile/${idea.author.username}`}
                className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
              >
                {idea.author.username}
              </Link>
              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                <Clock className="w-3 h-3" />
                <span>{formatDate(idea.updatedAt)}</span>
              </div>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className="flex items-center space-x-2">
            {idea.isFork && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400">
                <GitFork className="w-3 h-3 mr-1" />
                Fork
              </span>
            )}
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              idea.visibility === 'public' 
                ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
            }`}>
              {idea.visibility}
            </span>
          </div>
        </div>

        {/* Title and Description */}
        <div className="mb-4">
          <Link to={`/ideas/${idea.id}`}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 mb-2">
              {idea.title}
            </h3>
          </Link>
          <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
            {idea.description}
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {idea.tags.slice(0, 3).map((tag) => (
            <Link
              key={tag}
              to={`/search?tag=${encodeURIComponent(tag)}`}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
            >
              {tag}
            </Link>
          ))}
          {idea.tags.length > 3 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
              +{idea.tags.length - 3} more
            </span>
          )}
        </div>

        {/* Language and Category */}
        <div className="flex items-center space-x-4 mb-4 text-sm text-gray-500 dark:text-gray-400">
          {idea.language && (
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>{idea.language}</span>
            </div>
          )}
          <span>•</span>
          <span>{idea.category}</span>
          <span>•</span>
          <span>{idea.license}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Use our new Star Button component */}
            <StarButton 
              ideaId={idea.id}
              initialStarCount={idea.stars}
              isInitiallyStarred={idea.isStarred}
              className="px-3 py-1 rounded-lg text-sm font-medium transition-colors"
            />
            
            {/* Use our new Fork Button component */}
            <ForkButton 
              idea={idea}
              className="flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            />
            
            <Link
              to={`/ideas/${idea.id}#comments`}
              className="flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{idea.comments.length}</span>
            </Link>
          </div>

          <Link
            to={`/ideas/${idea.id}`}
            className="flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>View</span>
          </Link>
        </div>
      </div>
    </div>
  );
};