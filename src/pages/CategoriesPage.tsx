import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout/Layout';
import { 
  Code, 
  Heart, 
  GraduationCap, 
  Stethoscope, 
  Leaf, 
  Briefcase, 
  Gamepad2, 
  Palette,
  Rocket,
  Zap,
  Users,
  Globe,
  Loader2
} from 'lucide-react';
import { api } from '../services/api';

interface Category {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  count: number;
  trending: boolean;
}

const defaultCategories: Category[] = [
  {
    id: 'development-tools',
    name: 'Development Tools',
    description: 'Code editors, frameworks, libraries, and developer utilities',
    icon: Code,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    count: 12847,
    trending: true,
  },
  {
    id: 'social-impact',
    name: 'Social Impact',
    description: 'Ideas that aim to solve social problems and improve communities',
    icon: Heart,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/20',
    count: 8934,
    trending: true,
  },
  {
    id: 'education',
    name: 'Education',
    description: 'Learning platforms, educational tools, and knowledge sharing',
    icon: GraduationCap,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    count: 7652,
    trending: false,
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    description: 'Medical innovations, health apps, and wellness solutions',
    icon: Stethoscope,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    count: 5431,
    trending: true,
  },
  {
    id: 'environment',
    name: 'Environment',
    description: 'Sustainability, climate solutions, and environmental protection',
    icon: Leaf,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/20',
    count: 4298,
    trending: false,
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Entrepreneurship, productivity tools, and business solutions',
    icon: Briefcase,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    count: 9876,
    trending: false,
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    description: 'Games, media platforms, and creative entertainment solutions',
    icon: Gamepad2,
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-100 dark:bg-pink-900/20',
    count: 6543,
    trending: false,
  },
  {
    id: 'design',
    name: 'Design & Creative',
    description: 'Design tools, creative platforms, and artistic innovations',
    icon: Palette,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
    count: 3987,
    trending: true,
  },
];

export const CategoriesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showTrendingOnly, setShowTrendingOnly] = useState(false);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [platformStats, setPlatformStats] = useState({
    totalIdeas: 0,
    activeUsers: 0,
    ideasThisWeek: 0,
    totalCollaborations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetchCategoryData();
    fetchPlatformStats();
  }, []);

  const fetchCategoryData = async () => {
    try {
      setLoading(true);
      const response = await api.getCategoryStats();
      
      // Merge with default categories to include icons and descriptions
      const updatedCategories = defaultCategories.map(defaultCat => {
        const dbCat = response.data.find(cat => cat.name === defaultCat.name);
        return {
          ...defaultCat,
          count: dbCat?.count || 0,
          trending: dbCat?.trending || false,
        };
      });
      
      setCategories(updatedCategories);
    } catch (error) {
      console.error('Error fetching category data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatformStats = async () => {
    try {
      setStatsLoading(true);
      const response = await api.getPlatformStats();
      setPlatformStats(response.data);
    } catch (error) {
      console.error('Error fetching platform stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         category.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTrending = !showTrendingOnly || category.trending;
    return matchesSearch && matchesTrending;
  });

  const totalIdeas = categories.reduce((sum, category) => sum + category.count, 0);
  const trendingCategories = categories.filter(cat => cat.trending);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Browse Categories
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Explore ideas organized by topic and industry
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {statsLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-lg">
                    <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Categories</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{categories.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded-lg">
                    <Rocket className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Ideas</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {platformStats.totalIdeas.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="bg-orange-100 dark:bg-orange-900/20 p-2 rounded-lg">
                    <Zap className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Trending</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{trendingCategories.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-100 dark:bg-purple-900/20 p-2 rounded-lg">
                    <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Active Contributors</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {platformStats.activeUsers.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search categories..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showTrendingOnly}
                  onChange={(e) => setShowTrendingOnly(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Trending only</span>
              </label>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  </div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4"></div>
                  <div className="flex items-center justify-between">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  </div>
                </div>
                <div className="h-1 bg-gray-100 dark:bg-gray-700">
                  <div className="h-full bg-gray-200 dark:bg-gray-600 w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.id}
                  to={`/explore?category=${encodeURIComponent(category.name)}`}
                  className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 overflow-hidden"
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-lg ${category.bgColor}`}>
                        <Icon className={`w-6 h-6 ${category.color}`} />
                      </div>
                      {category.trending && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-400">
                          <Zap className="w-3 h-3 mr-1" />
                          Trending
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {category.description}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {category.count.toLocaleString()} ideas
                      </span>
                      <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium">
                        Explore
                        <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-1 bg-gray-100 dark:bg-gray-700">
                    <div 
                      className={`h-full ${category.bgColor.replace('bg-', 'bg-').replace('/20', '')}`}
                      style={{ width: `${Math.min((category.count / Math.max(...categories.map(c => c.count))) * 100, 100)}%` }}
                    ></div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No categories found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search terms or filters.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};