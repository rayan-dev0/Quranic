/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [''], // Add any image domains you'll be using
    unoptimized: true,
  },
  output: 'export', // Static HTML export for Cloudflare Pages
};

export default nextConfig; 