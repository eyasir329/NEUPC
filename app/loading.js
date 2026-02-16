'use client';

import { useEffect, useState } from 'react';

export default function Loading() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Simulate loading progress
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 15;
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="relative min-h-screen bg-linear-to-b from-gray-900 via-black to-gray-900">
      {/* Loading Content */}
      <div className="flex min-h-screen items-center justify-center px-4 py-20">
        {/* Animated Decorative Elements */}
        <div className="from-primary-500/10 fixed top-20 right-10 h-72 w-72 animate-pulse rounded-full bg-linear-to-br to-transparent opacity-70 blur-3xl"></div>
        <div
          className="from-secondary-500/10 fixed bottom-20 left-10 h-72 w-72 animate-pulse rounded-full bg-linear-to-br to-transparent opacity-70 blur-3xl"
          style={{ animationDelay: '1s' }}
        ></div>

        <div
          className={`relative w-full max-w-md transition-all duration-700 ${
            isLoaded ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        >
          {/* Loading Card */}
          <div className="relative rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl sm:p-12">
            <div className="relative flex flex-col items-center gap-8">
              {/* Logo/Brand */}
              <div className="animate-pulse">
                <div className="from-primary-300 to-secondary-300 mb-4 bg-linear-to-r via-white bg-clip-text text-5xl font-black text-transparent sm:text-6xl">
                  NEUPC
                </div>
              </div>

              {/* Spinner Container */}
              <div className="relative">
                {/* Outer Ring */}
                <div className="relative h-32 w-32 sm:h-40 sm:w-40">
                  {/* Background Circle */}
                  <div className="border-primary-500/10 absolute inset-0 rounded-full border-4"></div>

                  {/* Animated Spinner */}
                  <div className="border-t-primary-500 border-r-secondary-500 absolute inset-0 animate-spin rounded-full border-4 border-transparent"></div>

                  {/* Inner Circle with Glow */}
                  <div className="absolute inset-2 rounded-full border-2 border-white/5 bg-white/5 backdrop-blur-sm">
                    <div className="flex h-full items-center justify-center">
                      <div className="from-primary-500/30 to-secondary-500/30 h-16 w-16 animate-pulse rounded-full bg-linear-to-br blur-xl"></div>
                    </div>
                  </div>

                  {/* Center Icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-pulse text-4xl">💻</div>
                  </div>
                </div>

                {/* Rotating Dots */}
                <div
                  className="absolute inset-0 animate-spin"
                  style={{ animationDuration: '3s' }}
                >
                  <div className="bg-primary-500 absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full"></div>
                  <div className="bg-secondary-500 absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full"></div>
                </div>
              </div>

              {/* Loading Text */}
              <div className="text-center">
                <h2 className="from-primary-300 to-secondary-300 mb-2 bg-linear-to-r via-white bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
                  Loading
                  <span className="animate-pulse">.</span>
                  <span
                    className="animate-pulse"
                    style={{ animationDelay: '0.2s' }}
                  >
                    .
                  </span>
                  <span
                    className="animate-pulse"
                    style={{ animationDelay: '0.4s' }}
                  >
                    .
                  </span>
                </h2>
                <p className="text-sm text-gray-400 sm:text-base">
                  Preparing your experience
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full">
                <div className="mb-2 flex items-center justify-between text-xs text-gray-400">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="from-primary-500 to-secondary-500 h-full bg-linear-to-r transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="h-full w-full animate-pulse bg-white/20"></div>
                  </div>
                </div>
              </div>

              {/* Animated Dots */}
              <div className="flex gap-2">
                <div
                  className="bg-primary-500 shadow-primary-500/50 h-3 w-3 animate-bounce rounded-full shadow-lg"
                  style={{ animationDelay: '0ms' }}
                ></div>
                <div
                  className="bg-secondary-500 shadow-secondary-500/50 h-3 w-3 animate-bounce rounded-full shadow-lg"
                  style={{ animationDelay: '150ms' }}
                ></div>
                <div
                  className="bg-primary-500 shadow-primary-500/50 h-3 w-3 animate-bounce rounded-full shadow-lg"
                  style={{ animationDelay: '300ms' }}
                ></div>
              </div>

              {/* Status Messages */}
              <div className="text-center">
                <p className="animate-pulse text-xs text-gray-500">
                  {progress < 30 && 'Initializing...'}
                  {progress >= 30 && progress < 60 && 'Loading resources...'}
                  {progress >= 60 && progress < 90 && 'Almost ready...'}
                  {progress >= 90 && 'Finalizing...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
