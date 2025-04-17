module.exports = {
    reactStrictMode: true,
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'cf.geekdo-images.com',
                pathname: '/**', // <- imágenes de BoardGameGeek
            },
        ],
    },
    async rewrites() {
        return [
            {
                source: '/sw.js',
                destination: '/static/sw.js',
            },
        ];
    },
    async headers() {
        return [
            {
                source: '/sw.js',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'no-cache, no-store, must-revalidate',
                    },
                    {
                        key: 'Content-Type',
                        value: 'application/javascript',
                    },
                ],
            },
        ];
    },
};
