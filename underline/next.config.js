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
        ],
    },
    // Enable strict mode for better development experience
    reactStrictMode: true,
    // Optimize for production
    swcMinify: true,
}

module.exports = nextConfig
