'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Navigation Component
 * Provides navigation between main pages
 */
export default function Navigation() {
  const pathname = usePathname();

  const isActive = (path) => pathname === path;

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center px-4 text-xl font-bold text-gray-900">
              Discer.io
            </Link>
            <div className="flex space-x-1 ml-8">
              <Link
                href="/builder"
                className={`inline-flex items-center px-4 border-b-2 ${
                  isActive('/builder')
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } transition-colors`}
              >
                Builder
              </Link>
              <Link
                href="/lessons"
                className={`inline-flex items-center px-4 border-b-2 ${
                  isActive('/lessons')
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } transition-colors`}
              >
                Lessons
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

