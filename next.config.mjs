/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [''], // Add any image domains you'll be using
    unoptimized: true,
  },
};

export default nextConfig; 