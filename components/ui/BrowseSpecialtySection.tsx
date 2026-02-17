import React, { useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { SpecialtyCard } from './SpecialtyCard';

interface BrowseSpecialtySectionProps {
    categories: any[];
    onCategoryClick: (name: string) => void;
    selectedSpecialty: string;
}

export const BrowseSpecialtySection: React.FC<BrowseSpecialtySectionProps> = ({
    categories,
    onCategoryClick,
    selectedSpecialty
}) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scrollContainer = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = direction === 'left' ? -300 : 300;
            scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <section className="py-10 md:py-12 border-t border-slate-100/50 mt-4">
            <div className="mb-6">
                <h2 className="text-[24px] font-bold tracking-[-0.3px] text-slate-900 leading-tight">Browse Specialty</h2>
                <p className="text-[14px] text-slate-500 font-medium mt-1 opacity-60">Premium care across every medical wing</p>
            </div>

            <div className="relative group/carousel overflow-visible">
                {/* Floating Arrows */}
                <button
                    onClick={() => scrollContainer('left')}
                    className="absolute left-1 md:left-[-22px] top-1/2 -translate-y-1/2 z-30 w-10 md:w-11 h-10 md:h-11 rounded-full bg-white/70 md:bg-white/60 backdrop-blur-[10px] border border-white/40 shadow-[0_8px_20px_rgba(0,0,0,0.12)] flex items-center justify-center text-slate-900 transition-all hover:bg-white/85 hover:scale-105 opacity-100 md:opacity-0 md:group-hover/carousel:opacity-100"
                >
                    <ChevronRight size={20} className="rotate-180" />
                </button>

                <button
                    onClick={() => scrollContainer('right')}
                    className="absolute right-1 md:right-[-22px] top-1/2 -translate-y-1/2 z-30 w-10 md:w-11 h-10 md:h-11 rounded-full bg-white/70 md:bg-white/60 backdrop-blur-[10px] border border-white/40 shadow-[0_8px_20px_rgba(0,0,0,0.12)] flex items-center justify-center text-slate-900 transition-all hover:bg-white/85 hover:scale-105 opacity-100 md:opacity-0 md:group-hover/carousel:opacity-100"
                >
                    <ChevronRight size={20} />
                </button>

                <div
                    ref={scrollContainerRef}
                    id="specialty-carousel"
                    className="flex gap-5 overflow-x-auto scroll-smooth no-scrollbar pb-6 -mx-1 px-1"
                >
                    {categories.map((cat) => (
                        <SpecialtyCard
                            key={cat.name}
                            name={cat.name}
                            icon={cat.icon}
                            color={cat.color}
                            bg={cat.bg}
                            onClick={() => onCategoryClick(cat.name)}
                            isSelected={selectedSpecialty === cat.name || (cat.name === 'General Physician' && selectedSpecialty === 'Physician')}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};
