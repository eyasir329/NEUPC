
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { User, Mail, Shield, Check, AlertTriangle } from 'lucide-react';

const roles = ['guest', 'member', 'mentor', 'executive', 'admin'];

export default function CreateUserClient() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const loadingToast = toast.loading('Creating user...');

    try {
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fullName, email, role }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user');
      }

      toast.success(
        `User "${fullName}" created successfully! An invitation has been sent to ${email}.`,
        { id: loadingToast, duration: 5000 }
      );

      // Redirect after a short delay
      setTimeout(() => {
        router.push('/account/admin/users');
      }, 2000);
    } catch (error) {
      toast.error(`Error: ${error.message}`, { id: loadingToast });
      setIsLoading(false);
    }
  };

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#333',
            color: '#fff',
          },
        }}
      />
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-gray-300"
            >
              Full Name
            </label>
            <div className="relative mt-2">
              <User className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pr-4 pl-10 text-white placeholder-gray-400 transition-colors focus:border-blue-500/50 focus:outline-none"
                placeholder="e.g., John Doe"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300"
            >
              Email Address
            </label>
            <div className="relative mt-2">
              <Mail className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pr-4 pl-10 text-white placeholder-gray-400 transition-colors focus:border-blue-500/50 focus:outline-none"
                placeholder="e.g., user@example.com"
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-300"
            >
              Assign Role
            </label>
            <div className="relative mt-2">
              <Shield className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
                className="w-full appearance-none rounded-lg border border-white/10 bg-white/5 py-2.5 pr-4 pl-10 text-white transition-colors focus:border-blue-500/50 focus:outline-none"
              >
                {roles.map((r) => (
                  <option
                    key={r}
                    value={r}
                    className="bg-gray-800 text-white"
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Invitation Info */}
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
            <p className="text-sm text-blue-300">
              An invitation link will be sent to the user's email address for
              them to set their password.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-green-500/20 px-4 py-2.5 font-semibold text-green-300 transition-colors hover:bg-green-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  Create User
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
