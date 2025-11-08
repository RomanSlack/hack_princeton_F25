'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Navigation Component
 * Provides navigation between main pages
 */
export default function Navigation() {
  const pathname = usePathname();
  const { isDark, toggleTheme, text, bg, border } = useTheme();

  const isActive = (path) => pathname === path;

  return (
    <nav className={`${bg.secondary} shadow-sm ${border.primary} border-b transition-colors`}>
      <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className={`flex items-center px-4 text-xl font-bold ${text.primary} transition-colors`}>
              Discer.io
            </Link>
            <div className="flex space-x-1 ml-8">
              <Link
                href="/builder"
                className={`inline-flex items-center px-4 border-b-2 transition-colors ${
                  isActive('/builder')
                    ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                    : `border-transparent ${text.secondary} hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600`
                }`}
              >
                Builder
              </Link>
              <Link
                href="/lessons"
                className={`inline-flex items-center px-4 border-b-2 transition-colors ${
                  isActive('/lessons')
                    ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                    : `border-transparent ${text.secondary} hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600`
                }`}
              >
                Lessons
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg ${bg.hover} transition-colors ${text.primary}`}
              aria-label="Toggle dark mode"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

