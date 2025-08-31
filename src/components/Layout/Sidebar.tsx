import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Compass, 
  Star, 
  GitFork, 
  TrendingUp, 
  Users, 
  Settings,
  User,
  Grid
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/explore', label: 'Explore', icon: Compass },
    { path: '/popular', label: 'Popular', icon: TrendingUp },
  ];

  const userNavItems = isAuthenticated ? [
    { path: '/dashboard', label: 'Dashboard', icon: User },
    { path: '/workspaces', label: 'Workspaces', icon: Grid },
    { path: '/starred', label: 'Starred', icon: Star },
    { path: '/forks', label: 'Forks', icon: GitFork },
    { path: '/following', label: 'Following', icon: Users },
    { path: '/settings', label: 'Settings', icon: Settings },
  ] : [];

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 h-screen sticky top-16 overflow-y-auto">
      <div className="p-4">
        {/* Main Navigation */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Navigation */}
        {isAuthenticated && (
          <>
            <hr className="my-6 border-gray-200 dark:border-gray-700" />
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-3">
                Personal
              </h3>
              {userNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* Quick Stats */}
        {isAuthenticated && user && (
          <>
            <hr className="my-6 border-gray-200 dark:border-gray-700" />
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-3">
                Quick Stats
              </h3>
              <div className="px-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Public ideas</span>
                  <span className="font-medium text-gray-900 dark:text-white">{user.publicRepos}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Followers</span>
                  <span className="font-medium text-gray-900 dark:text-white">{user.followers}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Following</span>
                  <span className="font-medium text-gray-900 dark:text-white">{user.following}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="px-3 space-y-2 text-xs text-gray-500 dark:text-gray-400">
            <Link to="/about" className="block hover:text-blue-600 dark:hover:text-blue-400">
              About IdeaHub
            </Link>
            <Link to="/privacy" className="block hover:text-blue-600 dark:hover:text-blue-400">
              Privacy Policy
            </Link>
            <Link to="/terms" className="block hover:text-blue-600 dark:hover:text-blue-400">
              Terms of Service
            </Link>
            <div className="pt-2 text-xs">
              © 2024 IdeaHub. Open Source.
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};