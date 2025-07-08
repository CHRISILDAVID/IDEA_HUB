import React, { useState, useEffect } from 'react';
import { IdeaCard } from './IdeaCard';
import { Idea, SearchFilters } from '../../types';
import { api } from '../../services/api';
import { Loader2 } from 'lucide-react';

interface IdeaListProps {
  filters?: Partial<SearchFilters>;
  title?: string;
  showFilters?: boolean;
}

export const IdeaList: React.FC<IdeaListProps> = ({ filters, title, showFilters = true }) => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<Partial<SearchFilters>>(filters || {});

  useEffect(() => {
    fetchIdeas();
  }, [currentFilters]);

  const fetchIdeas = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getIdeas(currentFilters);
      setIdeas(response.data);
    } catch (err) {
      setError('Failed to fetch ideas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleIdeaUpdate = (updatedIdea: Idea) => {
    setIdeas(prevIdeas =>
      prevIdeas.map(idea => idea.id === updatedIdea.id ? updatedIdea : idea)
    );
  };

  const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
    setCurrentFilters(prev => ({ ...prev, ...newFilters }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchIdeas}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {title && (
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {ideas.length} idea{ideas.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sort by
              </label>
              <select
                value={currentFilters.sort || 'newest'}
                onChange={(e) => handleFilterChange({ sort: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="most-stars">Most Stars</option>
                <option value="most-forks">Most Forks</option>
                <option value="recently-updated">Recently Updated</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={currentFilters.category || 'all'}
                onChange={(e) => handleFilterChange({ category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="Development Tools">Development Tools</option>
                <option value="Social Impact">Social Impact</option>
                <option value="Education">Education</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Environment">Environment</option>
                <option value="Business">Business</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                License
              </label>
              <select
                value={currentFilters.license || 'all'}
                onChange={(e) => handleFilterChange({ license: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Licenses</option>
                <option value="MIT">MIT</option>
                <option value="Apache-2.0">Apache 2.0</option>
                <option value="GPL-3.0">GPL 3.0</option>
                <option value="BSD-3-Clause">BSD 3-Clause</option>
                <option value="Creative Commons">Creative Commons</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Language
              </label>
              <select
                value={currentFilters.language || 'all'}
                onChange={(e) => handleFilterChange({ language: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Languages</option>
                <option value="JavaScript">JavaScript</option>
                <option value="Python">Python</option>
                <option value="TypeScript">TypeScript</option>
                <option value="Java">Java</option>
                <option value="C++">C++</option>
                <option value="Go">Go</option>
                <option value="Rust">Rust</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {ideas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              No ideas found matching your criteria.
            </p>
            <p className="text-gray-500 dark:text-gray-500 mt-2">
              Try adjusting your filters or search terms.
            </p>
          </div>
        ) : (
          ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} onUpdate={handleIdeaUpdate} />
          ))
        )}
      </div>
    </div>
  );
};