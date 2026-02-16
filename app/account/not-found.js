import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function AccountNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <h1 className="bg-linear-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-9xl font-bold text-transparent">
            404
          </h1>
        </div>

        {/* Message */}
        <div className="mb-8 space-y-3">
          <h2 className="text-3xl font-bold text-white">Page Not Found</h2>
          <p className="text-gray-400">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/account"
            className="group flex items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-6 py-3 font-semibold text-blue-300 shadow-lg transition-all duration-300 hover:border-blue-500/50 hover:bg-blue-500/20 hover:shadow-blue-500/20"
          >
            <Home className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
            <span>Go to Dashboard</span>
          </Link>

          <button
            onClick={() => window.history.back()}
            className="group flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-gray-300 shadow-lg transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1" />
            <span>Go Back</span>
          </button>
        </div>

        {/* Additional Help */}
        <div className="mt-12 rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <p className="mb-3 text-sm font-semibold text-white">Need Help?</p>
          <p className="text-sm text-gray-400">
            If you believe this is an error, please{' '}
            <Link
              href="/contact"
              className="text-blue-400 underline underline-offset-2 transition-colors hover:text-blue-300"
            >
              contact support
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
