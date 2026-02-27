'use client';

export default function AccountHeader({ session }) {
  return (
    <div className="mb-8 text-center">
      <h1 className="mb-3 text-4xl font-extrabold text-white sm:text-5xl">
        Welcome Back! 👋
      </h1>
      <p className="text-lg text-gray-300">{session?.name || 'Guest User'}</p>
      <p className="text-sm text-gray-500">
        {session?.email || 'guest@example.com'}
      </p>
    </div>
  );
}
