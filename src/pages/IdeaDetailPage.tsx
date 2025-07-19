import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout/Layout';
import { 
  Star, 
  GitFork, 
  MessageCircle, 
  Eye, 
  User,
  Calendar,
  Tag,
  Share2,
  Bookmark,
  MoreHorizontal
} from 'lucide-react';
import { api } from '../services/api';
import { Idea, Comment } from '../types';

export const IdeaDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchIdeaDetails();
    }
  }, [id]);

  const fetchIdeaDetails = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const [ideaResponse, commentsResponse] = await Promise.all([
        api.getIdea(id),
        api.getIdeaComments(id)
      ]);
      
      setIdea(ideaResponse.data);
      setComments(commentsResponse.data);
    } catch (err) {
      setError('Failed to load idea details');
      console.error('Error fetching idea details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStar = async () => {
    if (!idea) return;
    
    try {
      await api.starIdea(idea.id);
      setIdea(prev => prev ? {
        ...prev,
        isStarred: !prev.isStarred,
        stars: prev.stars + (prev.isStarred ? -1 : 1)
      } : null);
    } catch (error) {
      console.error('Error starring idea:', error);
    }
  };

  const handleFork = async () => {
    if (!idea) return;
    
    try {
      await api.forkIdea(idea.id);
      setIdea(prev => prev ? {
        ...prev,
        forks: prev.forks + 1
      } : null);
    } catch (error) {
      console.error('Error forking idea:', error);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !idea) return;

    try {
      setCommentLoading(true);
      const response = await api.createComment(idea.id, newComment.trim());
      setComments(prev => [response.data, ...prev]);
      setNewComment('');
    } catch (error) {
      console.error('Error creating comment:', error);
    } finally {
      setCommentLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error || !idea) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {error || 'Idea not found'}
            </h2>
            <Link
              to="/"
              className="text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              Go back to home
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Idea Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {idea.author.fullName || idea.author.username}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  @{idea.author.username}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <Share2 className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <Bookmark className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {idea.title}
          </h1>

          <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            {idea.description}
          </p>

          {/* Idea Meta */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <Calendar className="w-4 h-4 mr-1" />
              {formatDate(idea.createdAt)}
            </div>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <Tag className="w-4 h-4 mr-1" />
              {idea.category}
            </div>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <Eye className="w-4 h-4 mr-1" />
              {idea.stars + idea.forks} interactions
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleStar}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                idea.isStarred
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Star className={`w-4 h-4 ${idea.isStarred ? 'fill-current' : ''}`} />
              <span>{idea.stars}</span>
            </button>

            <button
              onClick={handleFork}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <GitFork className="w-4 h-4" />
              <span>{idea.forks}</span>
            </button>

            <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
              <MessageCircle className="w-4 h-4" />
              <span>{comments.length} comments</span>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Comments ({comments.length})
          </h2>

          {/* Add Comment Form */}
          <form onSubmit={handleComment} className="mb-6">
            <div className="flex space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={!newComment.trim() || commentLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {commentLoading ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {comment.author.fullName || comment.author.username}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}
            
            {comments.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
