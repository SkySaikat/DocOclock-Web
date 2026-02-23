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
    return (
        <section className="py-8 md:py-10 border-t border-slate-100/50 mt-8">
            <div className="flex justify-between items-center mb-6 md:mb-8">
                <div className="space-y-0.5">
                    <h2 className="text-[24px] md:text-[28px] font-black tracking-[-0.03em] text-slate-900 leading-tight">Find Doctors by Department</h2>
                    <p className="text-[13px] md:text-[14px] text-slate-500 font-medium opacity-70">Select from 36+ clinical areas to find a doctor</p>
                </div>
                <button className="text-[12px] md:text-[13px] font-black text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-widest border-b-2 border-blue-600/20 pb-0.5 mt-[-10px]">
                    View All
                </button>
            </div>

            <div className="grid grid-cols-3 gap-2 md:gap-4">
                {categories.map((cat) => (
                    <SpecialtyCard
                        key={cat.name}
                        name={cat.name}
                        subtitle={cat.subtitle}
                        icon={cat.icon}
                        color={cat.color}
                        bg={cat.bg}
                        onClick={() => onCategoryClick(cat.name)}
                        isSelected={selectedSpecialty === cat.name || (cat.name === 'General Physician' && selectedSpecialty === 'Physician')}
                    />
                ))}
            </div>
        </section>
    );
};
