'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import { useState } from 'react';

export function Navbar() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  const userEmail = user?.emailAddresses[0]?.emailAddress || '';
  const userInitial = userEmail?.[0]?.toUpperCase() || 'U';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">Z</span>
            </div>
            <span className="hidden sm:inline text-white font-bold text-xl">
              ZoomClone
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-300 hidden sm:inline">
                  {userEmail}
                </span>
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold hover:from-blue-600 hover:to-purple-700 transition"
                  >
                    {userInitial}
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden">
                      <Link
                        href="/dashboard"
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 transition"
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 transition"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/sign-in"
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
