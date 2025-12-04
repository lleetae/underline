/** @type {import('next').NextConfig} */
const withPWA = require("@ducanh2912/next-pwa").default({
    dest: "public",
    disable: process.env.NODE_ENV === "development",
    register: true,
    skipWaiting: true,
});

const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'http',
                hostname: 'image.aladin.co.kr',
            },
            {
                protocol: 'https',
                hostname: 'offpqskzcutkyyocvfqd.supabase.co',
            },
        ],
    },
    // Enable strict mode for better development experience
    reactStrictMode: true,
    // Optimize for production
    swcMinify: true,
    // Webpack configuration for polyfills
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                buffer: require.resolve('buffer/'),
            };
        }
        return config;
    },
}

module.exports = withPWA(nextConfig);
