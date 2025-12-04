import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Underline',
        short_name: 'Underline',
        description: '책으로 만나는 특별한 인연',
        start_url: '/',
        display: 'standalone',
        background_color: '#FCFCFA',
        theme_color: '#FCFCFA',
        icons: [
            {
                src: '/icons/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icons/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}
