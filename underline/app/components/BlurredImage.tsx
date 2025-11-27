'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';

interface BlurredImageProps {
    blurredUrl: string;
    originalUrl?: string;
    isUnveiled: boolean;
    alt?: string;
    className?: string;
}

export function BlurredImage({
    blurredUrl,
    originalUrl,
    isUnveiled,
    alt = 'Profile photo',
    className = ''
}: BlurredImageProps) {
    const [imageError, setImageError] = useState(false);

    const displayUrl = isUnveiled && originalUrl ? originalUrl : blurredUrl;

    return (
        <div className={`relative overflow-hidden ${className}`}>
            {/* Image */}
            <img
                src={imageError ? '/placeholder-avatar.png' : displayUrl}
                alt={alt}
                className={`w-full h-full object-cover transition-all duration-300 ${!isUnveiled ? 'blur-md scale-110' : ''
                    }`}
                onError={() => setImageError(true)}
            />

            {/* Overlay when blurred */}
            {!isUnveiled && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="bg-white/90 rounded-full p-4">
                        <Lock className="text-gray-700" size={32} />
                    </div>
                </div>
            )}

            {/* Unveil indicator */}
            {isUnveiled && originalUrl && (
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>공개됨</span>
                </div>
            )}
        </div>
    );
}
