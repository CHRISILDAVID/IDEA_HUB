import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout/Layout';
import { IdeaCard } from '../components/Ideas/IdeaCard';
import { GitFork, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Idea } from '../types';

export const ForksPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [forkedIdeas, setForkedIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchForkedIdeas();
    }
  }, [isAuthenticated, user]);

  const fetchForkedIdeas = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await api.getForkedIdeas(user.id);
      setForkedIdeas(response.data);
    } catch (err) {
      setError('Failed to fetch forked ideas');
      console.error('Error fetching forked ideas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleIdeaUpdate = (updatedIdea: Idea) => {
    setForkedIdeas(prev =>
      prev.map(idea => idea.id === updatedIdea.id ? updatedIdea : idea)
    );
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Please sign in to view your forked ideas
            </h1>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-purple-100 dark:bg-purple-900/20 p-3 rounded-lg">
              <GitFork className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Your Forks
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Ideas you've forked and made your own
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchForkedIdeas}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : forkedIdeas.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <GitFork className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No forked ideas yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Fork interesting ideas to build upon them and make them your own.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-gray-600 dark:text-gray-400">
                {forkedIdeas.length} forked idea{forkedIdeas.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            {forkedIdeas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} onUpdate={handleIdeaUpdate} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};