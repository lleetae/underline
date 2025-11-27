import React from "react";
import { MapPin } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface ProfileHeaderProps {
  imageUrl: string;
  name: string;
  age: string;
  location: string;
  intro: string;
}

export function ProfileHeader({
  imageUrl,
  name,
  age,
  location,
  intro,
}: ProfileHeaderProps) {
  return (
    <div className="flex flex-col items-center text-[#1A3C34] animate-in fade-in duration-700 slide-in-from-bottom-4">
      <div className="w-full max-w-md px-6 pt-4 pb-8">
        <div className="relative w-full aspect-[3/4] overflow-hidden rounded-sm mb-8 shadow-sm">
          <ImageWithFallback
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/5 mix-blend-overlay pointer-events-none" />
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-serif tracking-tight">
            {name}, <span className="text-lg font-normal opacity-80">{age}</span>
          </h1>
          
          <div className="flex items-center justify-center gap-1 text-sm uppercase tracking-widest opacity-60 font-sans mb-4">
            <MapPin className="w-3 h-3" />
            <span>{location}</span>
          </div>

          <p className="text-sm leading-relaxed opacity-80 font-sans max-w-xs mx-auto text-[#1A3C34]/90">
            {intro}
          </p>
        </div>
      </div>
    </div>
  );
}
