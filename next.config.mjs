/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Fix for react-pdf and pdfjs-dist
    config.resolve.alias.canvas = false;
    
    return config;
  },
};

export default nextConfig;
