'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function TopProgressBar() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Start loading
    setIsLoading(true);
    setProgress(10);

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 90) {
          return prev + Math.random() * 30;
        }
        return prev;
      });
    }, 200);

    // Stop loading after a short delay
    const timeout = setTimeout(() => {
      setProgress(100);
      interval && clearInterval(interval);

      // Fade out after completion
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 500);
    }, 800);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [pathname]);

  return (
    <>
      {isLoading && (
        <div className="fixed top-0 left-0 z-50 h-1 w-full bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-lg">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-lg shadow-blue-500/50 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </>
  );
}
