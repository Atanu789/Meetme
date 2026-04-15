'use client';

import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Home() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="grid md:grid-cols-2 gap-12 items-center min-h-[calc(100vh-5rem)]">
          {/* Left Content */}
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-2">
              <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
                Connect With
                <span className="gradient-text block">Anyone, Anywhere</span>
              </h1>
              <p className="text-lg text-gray-400 max-w-lg">
                Crystal-clear video calls, instant messaging, and screen sharing. 
                All in one beautiful, easy-to-use platform.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition inline-block text-center"
                  >
                    Go to Dashboard
                  </Link>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="px-8 py-3 border border-blue-500 text-blue-400 rounded-lg font-semibold hover:bg-blue-500/10 transition"
                  >
                    New Meeting
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/sign-up"
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition inline-block text-center"
                  >
                    Get Started Free
                  </Link>
                  <Link
                    href="/sign-in"
                    className="px-8 py-3 border border-blue-500 text-blue-400 rounded-lg font-semibold hover:bg-blue-500/10 transition inline-block text-center"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 pt-8">
              {[
                { icon: '📹', label: 'HD Video' },
                { icon: '🎤', label: 'Crystal Audio' },
                { icon: '🖥️', label: 'Screen Share' },
                { icon: '💬', label: 'Live Chat' },
              ].map((feature) => (
                <div key={feature.label} className="flex items-center gap-2">
                  <span className="text-2xl">{feature.icon}</span>
                  <span className="text-sm text-gray-300">{feature.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Visual */}
          <div className="hidden md:block">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl blur-3xl"></div>
              <div className="relative backdrop-blur-sm bg-slate-800/50 border border-slate-700 rounded-3xl p-8 h-96 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-4xl">📹</span>
                  </div>
                  <p className="text-gray-400">Crystal Clear Video Calls</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="border-t border-slate-700 py-12 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { number: '1M+', label: 'Daily Users' },
              { number: '150+', label: 'Countries' },
              { number: '99.9%', label: 'Uptime' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  {stat.number}
                </div>
                <p className="text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="border-t border-slate-700 py-16 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to connect?
          </h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Join millions of users worldwide and start your first meeting today.
          </p>
          {!user && (
            <Link
              href="/sign-up"
              className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Start Free Today
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
