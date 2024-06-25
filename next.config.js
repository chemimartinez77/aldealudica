/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
      domains: ['lh3.googleusercontent.com', 'cf.geekdo-images.com'],
    },
    async redirects() {
      return [
        {
          source: '/partidas',
          destination: '/partidas/crear',
          permanent: true,
        },
      ];
    },
  };
  
  module.exports = nextConfig;
  