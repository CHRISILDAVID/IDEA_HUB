import React from 'react';
import { Layout } from '../components/Layout/Layout';

export const AboutPage: React.FC = () => {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">About IdeaHub</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          IdeaHub is an open-source platform for creators to share, discover, and collaborate on innovative ideas from around the world. Whether you're brainstorming your next big project or just browsing for inspiration, IdeaHub makes it easy to connect and engage.
        </p>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Our Mission</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Our mission is to empower creators by providing a collaborative space where ideas can flourish, be refined, and ultimately turn into reality.
        </p>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Features</h2>
        <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mb-6">
          <li>Share and collaborate on ideas in real time</li>
          <li>Star, fork, and build upon community creations</li>
          <li>Activity feeds and notifications to stay updated</li>
          <li>Dark mode and customizable themes</li>
        </ul>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Get Involved</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Join our community on GitHub at <a href="https://github.com/CHRISILDAVID/IDEA_HUB" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">github.com/CHRISILDAVID/IDEA_HUB</a> to contribute, report issues, or suggest new features.
        </p>
      </div>
    </Layout>
  );
};
