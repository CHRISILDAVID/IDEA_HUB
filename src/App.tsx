import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthPersistence } from './components/AuthPersistence';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { PopularPage } from './pages/TrendingPage';
import { DashboardPage } from './pages/DashboardPage';
import { SettingsPage } from './pages/SettingsPage';
import { StarredPage } from './pages/StarredPage';
import { ForksPage } from './pages/ForksPage';
import { FollowingPage } from './pages/FollowingPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { IdeaWorkspacePage } from './pages/IdeaWorkspacePage';
import { WorkspacePage } from './pages/WorkspacePage';
import { WorkspacesListPage } from './pages/WorkspacesListPage';
import { LoginForm } from './components/Auth/LoginForm';
import { RegisterForm } from './components/Auth/RegisterForm';
import { AuthCallback } from './pages/AuthCallback';
import { AboutPage } from './pages/AboutPage';

function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <ThemeProvider>
          <AuthPersistence>
            <AuthProvider>
              <Router>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/explore" element={<ExplorePage />} />
                  <Route path="/popular" element={<PopularPage />} />
                  <Route path="/login" element={<LoginForm />} />
                  <Route path="/register" element={<RegisterForm />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/about" element={<AboutPage />} />
                  
                  {/* Universal Workspace Routes */}
                  <Route path="/create" element={
                    <ProtectedRoute>
                      <IdeaWorkspacePage />
                    </ProtectedRoute>
                  } />
                  <Route path="/ideas/new" element={
                    <ProtectedRoute>
                      <IdeaWorkspacePage />
                    </ProtectedRoute>
                  } />
                  <Route path="/ideas/:id" element={
                    <ProtectedRoute>
                      <IdeaWorkspacePage />
                    </ProtectedRoute>
                  } />
                  
                  {/* Other Protected Routes */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/starred" element={
                    <ProtectedRoute>
                      <StarredPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/forks" element={
                    <ProtectedRoute>
                      <ForksPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/following" element={
                    <ProtectedRoute>
                      <FollowingPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/notifications" element={
                    <ProtectedRoute>
                      <NotificationsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/workspaces" element={
                    <ProtectedRoute>
                      <WorkspacesListPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/workspace/:id" element={
                    <ProtectedRoute>
                      <WorkspacePage />
                    </ProtectedRoute>
                  } />
                </Routes>
              </Router>
            </AuthProvider>
          </AuthPersistence>
        </ThemeProvider>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;