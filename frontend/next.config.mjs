// next.config.js
const upstream = (process.env.VITE_AUTH_URL || process.env.NEXT_PUBLIC_AUTH_URL || 'https://veloren-dev.heyzack.ai').replace(/\/$/, '');

const nextConfig = {
  // your other config...
  async rewrites() {
    return [];
  },
};

export default nextConfig;
