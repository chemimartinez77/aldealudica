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
                pathname: '/**', // Esto permite todas las rutas dentro de ese dominio
            },
        ],
    },
    async rewrites() {
        return [
            {
                source: '/sw.js',
                destination: '/static/sw.js', // Apunta a public/static/sw.js
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
