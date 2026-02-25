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
        <section className="py-6 border-t border-slate-100">
            <div className="flex justify-between items-center mb-5">
                <div>
                    <h2 className="text-[20px] font-black tracking-tight text-slate-900 leading-none">Find by Department</h2>
                    <p className="text-[12px] text-slate-500 font-medium mt-1">Select from 36+ specialized clinical areas</p>
                </div>
                <button className="text-[10px] font-black text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-widest border-b-2 border-blue-600/10 pb-0.5">
                    View All
                </button>
            </div>

            <div className="grid grid-cols-3 gap-3 md:gap-3">
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
