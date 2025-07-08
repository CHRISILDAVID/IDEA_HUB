import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout/Layout';
import { IdeaCard } from '../components/Ideas/IdeaCard';
import { 
  TrendingUp, 
  Star, 
  Users, 
  GitFork, 
  Rocket, 
  ArrowRight,
  Activity,
  Zap,
  Target,
  Globe
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Idea, Activity as ActivityType } from '../types';

export const HomePage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [trendingIdeas, setTrendingIdeas] = useState<Idea[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [trendingResponse, activityResponse] = await Promise.all([
        api.getTrendingIdeas(),
        api.getActivityFeed(),
      ]);
      
      setTrendingIdeas(trendingResponse.data.slice(0, 3));
      setRecentActivity(activityResponse.data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIdeaUpdate = (updatedIdea: Idea) => {
    setTrendingIdeas(prev =>
      prev.map(idea => idea.id === updatedIdea.id ? updatedIdea : idea)
    );
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-8 md:p-12 text-white mb-12">
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Share Your Ideas.
              <br />
              <span className="text-blue-200">Shape the Future.</span>
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl">
              IdeaHub is the world's largest platform for sharing, collaborating, and building upon innovative ideas. 
              Join millions of creators, entrepreneurs, and visionaries.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/create"
                    className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors inline-flex items-center justify-center"
                  >
                    <Rocket className="w-5 h-5 mr-2" />
                    Share Your Idea
                  </Link>
                  <Link
                    to="/explore"
                    className="border-2 border-blue-200 text-blue-100 px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors inline-flex items-center justify-center"
                  >
                    <Globe className="w-5 h-5 mr-2" />
                    Explore Ideas
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors inline-flex items-center justify-center"
                  >
                    Get Started Free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                  <Link
                    to="/explore"
                    className="border-2 border-blue-200 text-blue-100 px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors inline-flex items-center justify-center"
                  >
                    Explore Ideas
                  </Link>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-blue-500">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-100">50K+</div>
                <div className="text-sm text-blue-200">Ideas Shared</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-100">25K+</div>
                <div className="text-sm text-blue-200">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-100">100+</div>
                <div className="text-sm text-blue-200">Categories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-100">24/7</div>
                <div className="text-sm text-blue-200">Community</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Trending Ideas */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                  <TrendingUp className="w-6 h-6 mr-2 text-orange-500" />
                  Trending Ideas
                </h2>
                <Link
                  to="/trending"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center"
                >
                  View all
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {trendingIdeas.map((idea) => (
                    <IdeaCard key={idea.id} idea={idea} onUpdate={handleIdeaUpdate} />
                  ))}
                </div>
              )}
            </section>

            {/* Features */}
            <section className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Why Choose IdeaHub?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-lg">
                    <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Lightning Fast</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Share and discover ideas in seconds with our optimized platform.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded-lg">
                    <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Global Community</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Connect with innovators and creators from around the world.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-purple-100 dark:bg-purple-900/20 p-2 rounded-lg">
                    <GitFork className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Version Control</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Track changes and collaborate on ideas with built-in versioning.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-orange-100 dark:bg-orange-900/20 p-2 rounded-lg">
                    <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Smart Discovery</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Find relevant ideas with AI-powered recommendations and search.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* User Welcome / CTA */}
            {isAuthenticated && user ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3 mb-4">
                  <img
                    src={user.avatar || `https://ui-avatars.com/api/?name=${user.fullName}&background=random`}
                    alt={user.fullName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Welcome back, {user.fullName.split(' ')[0]}!
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Ready to share your next big idea?
                    </p>
                  </div>
                </div>
                <Link
                  to="/create"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center justify-center"
                >
                  <Rocket className="w-4 h-4 mr-2" />
                  Create New Idea
                </Link>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Join the Community
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Sign up to share your ideas, collaborate with others, and turn concepts into reality.
                </p>
                <div className="space-y-2">
                  <Link
                    to="/register"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center justify-center"
                  >
                    Get Started Free
                  </Link>
                  <Link
                    to="/login"
                    className="w-full text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center justify-center"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-green-500" />
                Recent Activity
              </h3>
              
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <img
                        src={activity.user.avatar || `https://ui-avatars.com/api/?name=${activity.user.fullName}&background=random`}
                        alt={activity.user.fullName}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white">
                          <Link
                            to={`/profile/${activity.user.username}`}
                            className="font-medium hover:text-blue-600 dark:hover:text-blue-400"
                          >
                            {activity.user.username}
                          </Link>
                          {' '}
                          {activity.description}
                          {activity.idea && (
                            <Link
                              to={`/ideas/${activity.idea.id}`}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                            >
                              {' '}{activity.idea.title}
                            </Link>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimeAgo(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Platform Stats
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Ideas</span>
                  <span className="font-semibold text-gray-900 dark:text-white">50,247</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Active Users</span>
                  <span className="font-semibold text-gray-900 dark:text-white">25,193</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Ideas This Week</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">+1,247</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Collaborations</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">8,952</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};