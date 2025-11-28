/** @type {import('next').NextConfig} */
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

module.exports = nextConfig
