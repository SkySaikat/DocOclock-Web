import React, { useRef } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import { DoctorCard } from './DoctorCard';

interface RecommendedDoctorsSectionProps {
    doctors: any[];
    selectedSpecialty: string;
    onSelectDoctor?: (doc: any) => void;
    onClearFilters?: () => void;
}

export const RecommendedDoctorsSection: React.FC<RecommendedDoctorsSectionProps> = ({
    doctors,
    selectedSpecialty,
    onSelectDoctor,
    onClearFilters
}) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scrollContainer = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = direction === 'left' ? -300 : 300;
            scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <section className="py-10 md:py-12 border-t border-slate-100/50">
            <div className="mb-6">
                <h2 className="text-[24px] font-bold tracking-[-0.3px] text-slate-900 leading-tight">
                    {selectedSpecialty === 'All' ? 'Recommended Specialists' : `${selectedSpecialty} Specialists`}
                </h2>
                <p className="text-[14px] text-slate-500 font-medium mt-1 opacity-60">Showing {doctors.length} top-tier medical experts</p>
            </div>

            <div className="relative group/carousel overflow-visible">
                {/* Floating Arrows */}
                {doctors.length > 2 && (
                    <>
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
                    </>
                )}

                <div className="relative">
                    {doctors.length > 0 ? (
                        <div
                            ref={scrollContainerRef}
                            id="doctor-carousel"
                            className="flex gap-5 overflow-x-auto scroll-smooth no-scrollbar pb-6 -mx-1 px-1"
                        >
                            {doctors.map((doc) => (
                                <DoctorCard
                                    key={doc.id}
                                    doctor={{
                                        name: doc.name,
                                        specialty: doc.specialty,
                                        bmdcNumber: doc.bmdcNumber,
                                        experience: 12,
                                        rating: doc.rating,
                                        reviews: doc.totalPatients,
                                        image: doc.imageUrl,
                                        hospitalName: doc.chambers[0]?.name
                                    }}
                                    onCtaClick={() => onSelectDoctor?.(doc)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center">
                            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
                                <Search size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">No Specialists Found</h3>
                            <p className="text-slate-500 font-medium mt-1">Try a different specialty or clear your filters.</p>
                            {onClearFilters && (
                                <button onClick={onClearFilters} className="mt-6 text-blue-600 font-bold hover:underline transition-all">
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};
