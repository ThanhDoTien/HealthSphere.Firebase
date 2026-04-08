
'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Play, Heart, Share2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/context/LanguageContext';

type Short = {
  id: string;
  title: string;
  thumbnail: string;
  creator: string;
  views: string;
  category: string;
};

const SHORTS: Short[] = [
  {
    id: 'RZj-gkGGRh8',
    title: 'Healthy Habits to Transform Your Life | Simple Routine',
    thumbnail: 'https://img.youtube.com/vi/RZj-gkGGRh8/hqdefault.jpg',
    creator: '@doctor0food',
    views: '883K',
    category: 'Nutrition'
  },
  {
    id: 'kOPvEDSQWHI',
    title: '7 strange signs you’re actually healthy',
    thumbnail: 'https://img.youtube.com/vi/kOPvEDSQWHI/hqdefault.jpg',
    creator: '@niallkiddle',
    views: '3.7M',
    category: 'Wellness'
  },
  {
    id: 'RjByQoG1v_E',
    title: 'Daily habits for physical AND mental health',
    thumbnail: 'https://img.youtube.com/vi/RjByQoG1v_E/hqdefault.jpg',
    creator: '@growingannanas',
    views: '2.7M',
    category: 'Mindfulness'
  },
  {
    id: 'fkkxCf990MI',
    title: '3-Step Sciatica Fix!',
    thumbnail: 'https://img.youtube.com/vi/fkkxCf990MI/hqdefault.jpg',
    creator: '@RehabFix',
    views: '18M',
    category: 'Fitness'
  },
  {
    id: 'bcqKV9Wh3t8',
    title: '4 Signs Of Burnout 🔥',
    thumbnail: 'https://img.youtube.com/vi/bcqKV9Wh3t8/hqdefault.jpg',
    creator: '@DrJulie',
    views: '1.3M',
    category: 'Mental Health'
  },
  {
    id: '_i3gGfwd9jg',
    title: '5 daily wellness tips!',
    thumbnail: 'https://img.youtube.com/vi/_i3gGfwd9jg/hqdefault.jpg',
    creator: '@SanneVloet',
    views: '1.2M',
    category: 'Lifestyle'
  },
  {
    id: '4DNZq2nXdJ0',
    title: 'Food is Medicine 🍎 | Health Benefits',
    thumbnail: 'https://img.youtube.com/vi/4DNZq2nXdJ0/hqdefault.jpg',
    creator: '@HealthySeniors',
    views: '926K',
    category: 'Nutrition'
  },
  {
    id: 'h_Hz74BLSnM',
    title: 'How to improve your mental health',
    thumbnail: 'https://img.youtube.com/vi/h_Hz74BLSnM/hqdefault.jpg',
    creator: '@MOTIVATION2STUDY',
    views: '1M',
    category: 'Mental Health'
  },
  {
    id: 'tnFPhNNo4Fw',
    title: 'This is what anxiety feels like',
    thumbnail: 'https://img.youtube.com/vi/tnFPhNNo4Fw/hqdefault.jpg',
    creator: '@olivialutfallah',
    views: '10M',
    category: 'Mental Health'
  },
  {
    id: '_yKCEYjyPKU',
    title: 'TRY THIS TO FALL ASLEEP FAST',
    thumbnail: 'https://img.youtube.com/vi/_yKCEYjyPKU/hqdefault.jpg',
    creator: '@NurseSarahJeffries',
    views: '1.4M',
    category: 'Sleep'
  },
  {
    id: '76xHImc2-qc',
    title: 'Let’s meal prep for the week',
    thumbnail: 'https://img.youtube.com/vi/76xHImc2-qc/hqdefault.jpg',
    creator: '@NutritionByKylie',
    views: '1.9M',
    category: 'Nutrition'
  },
  {
    id: 'L16TdwIu93A',
    title: 'Stop Being Scared of Diet Soda',
    thumbnail: 'https://img.youtube.com/vi/L16TdwIu93A/hqdefault.jpg',
    creator: '@RenaissancePeriodization',
    views: '291k',
    category: 'Nutrition'
  }
];

export default function HealthShorts() {
  const { t } = useTranslation();
  const [selectedShort, setSelectedShort] = useState<Short | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="space-y-4 group/section relative">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          {t('discover.shortsTitle') || 'Health & Lifestyle Shorts'}
        </h2>
      </div>

      <div className="relative">
        {/* Navigation Buttons */}
        <button 
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/80 backdrop-blur-md border shadow-lg flex items-center justify-center opacity-0 group-hover/section:opacity-100 transition-opacity hover:bg-background -ml-2 sm:-ml-5 lg:flex hidden"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <button 
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/80 backdrop-blur-md border shadow-lg flex items-center justify-center opacity-0 group-hover/section:opacity-100 transition-opacity hover:bg-background -mr-2 sm:-mr-5 lg:flex hidden"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        <div 
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto pb-4 px-1 no-scrollbar scroll-smooth"
        >
          {SHORTS.map((short) => (
            <div 
              key={short.id}
              className="relative flex-shrink-0 w-[180px] sm:w-[220px] aspect-[9/16] rounded-2xl overflow-hidden group cursor-pointer shadow-lg hover:shadow-primary/20 transition-all duration-300"
              onClick={() => setSelectedShort(short)}
            >
              <Image 
                src={short.thumbnail}
                alt={short.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                unoptimized
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
              
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                 <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                    <Play className="h-6 w-6 text-white fill-white" />
                 </div>
              </div>

              <div className="absolute top-3 left-3">
                <span className="px-2 py-1 rounded-md bg-black/40 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider border border-white/10">
                  {short.category}
                </span>
              </div>

              <div className="absolute bottom-4 left-4 right-4 text-white">
                <p className="text-sm font-bold leading-tight line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                  {short.title}
                </p>
                <div className="flex items-center justify-between opacity-80 mt-2">
                  <span className="text-[10px] font-medium">{short.creator}</span>
                  <span className="text-[10px] flex items-center gap-1">
                     <Heart className="h-2.5 w-2.5 fill-red-500 text-red-500" /> {short.views}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!selectedShort} onOpenChange={(open) => !open && setSelectedShort(null)}>
        <DialogContent className="max-w-[400px] p-0 overflow-hidden bg-black border-none sm:aspect-[9/16]">
          {selectedShort && (
            <div className="relative w-full h-full flex flex-col pt-10">
              <div className="absolute top-2 right-2 z-50">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full bg-black/20 text-white hover:bg-black/40"
                  onClick={() => setSelectedShort(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <iframe
                src={`https://www.youtube.com/embed/${selectedShort.id}?autoplay=1&modestbranding=1&rel=0`}
                title={selectedShort.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              
              <div className="p-4 bg-gradient-to-t from-black to-transparent space-y-2">
                 <h3 className="text-lg font-bold text-white leading-tight">
                    {selectedShort.title}
                 </h3>
                 <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-300">{selectedShort.creator}</p>
                    <div className="flex gap-3">
                       <Button variant="ghost" size="icon" className="text-white h-8 w-8">
                          <Heart className="h-5 w-5" />
                       </Button>
                       <Button variant="ghost" size="icon" className="text-white h-8 w-8">
                          <Share2 className="h-5 w-5" />
                       </Button>
                    </div>
                 </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
