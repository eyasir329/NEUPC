/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    qualities: [75, 80],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fgfvuckrafohyjiuidnw.supabase.co',
        port: '',
        pathname: '/storage/v1/object/sign/club-images/**',
      },
      // Google OAuth avatars
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      // GitHub OAuth avatars
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      // Generic HTTPS fallback for other providers
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
    ],
  },
  // output: "export",
};

export default nextConfig;
