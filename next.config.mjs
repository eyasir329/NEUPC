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
    ],
  },
  // output: "export",
};

export default nextConfig;
