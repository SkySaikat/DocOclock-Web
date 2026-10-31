import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
   DEPARTMENTS, SYMPTOMS, departmentIcon, DoctorFilter,
} from '../../utils/departments';

interface DepartmentPickerProps {
   selected?: DoctorFilter | null;
   onSelect: (filter: DoctorFilter) => void;
   /** Cards shown before the "show all" toggle (or in total when `expandable` is false). */
   initialCount?: number;
   /** Adds a "Show all" toggle that reveals the rest of the list. */
   expandable?: boolean;
   title?: string;
   className?: string;
}

type Tab = 'departments' | 'symptoms';

const CARD =
   'dc-rise group relative flex min-h-[148px] flex-col items-center justify-center gap-3 rounded-2xl border bg-white px-3 py-5 text-center transition-all duration-300 ease-out hover:-translate-y-1 hover:border-primary-300 hover:shadow-lg hover:shadow-primary-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0';

/**
 * Department / Symptom picker. Department icons are drawn through a CSS mask so they take the live brand colour
 * (Super Admin → Branding); symptom icons are lucide glyphs for the same reason.
 */
export const DepartmentPicker: React.FC<DepartmentPickerProps> = ({
   selected = null,
   onSelect,
   initialCount = 15,
   expandable = false,
   title = 'Choose a Department or Symptom',
   className = '',
}) => {
   const [tab, setTab] = useState<Tab>(selected?.kind === 'symptom' ? 'symptoms' : 'departments');
   const [showAll, setShowAll] = useState(false);

   const departments = expandable && showAll ? DEPARTMENTS : DEPARTMENTS.slice(0, initialCount);
   const symptoms = SYMPTOMS;
   const hiddenCount = DEPARTMENTS.length - initialCount;

   return (
      <section className={`flex flex-col gap-6 ${className}`} aria-label={title}>
         <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-display text-[26px] font-bold leading-tight text-ink-900 md:text-[32px]">{title}</h2>
            <div role="tablist" aria-label="Browse by" className="relative grid grid-cols-2 rounded-full border border-ink-100 bg-white p-1">
               <span
                  aria-hidden="true"
                  className={`absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-primary-500 shadow-sm shadow-primary-500/30 transition-transform duration-300 ease-out motion-reduce:transition-none ${tab === 'symptoms' ? 'translate-x-full' : ''}`}
               />
               {(['departments', 'symptoms'] as Tab[]).map((t) => (
                  <button
                     key={t}
                     type="button"
                     role="tab"
                     aria-selected={tab === t}
                     onClick={() => setTab(t)}
                     className={`relative z-10 rounded-full px-5 py-2 text-[15px] font-semibold capitalize transition-colors duration-300 motion-reduce:transition-none ${tab === t ? 'text-white' : 'text-ink-500 hover:text-ink-900'}`}
                  >
                     {t}
                  </button>
               ))}
            </div>
         </div>

         <div key={tab} role="tabpanel" className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-5">
            {tab === 'departments'
               ? departments.map((dept, i) => {
                  const active = selected?.kind === 'department' && selected.id === dept.id;
                  return (
                     <button
                        key={dept.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => onSelect({ kind: 'department', id: dept.id })}
                        style={{ '--i': Math.min(i, 14) } as React.CSSProperties}
                        className={`${CARD} ${active ? 'border-primary-500 bg-primary-50 shadow-md shadow-primary-500/10' : 'border-ink-100'}`}
                     >
                        <span
                           aria-hidden="true"
                           className="block size-11 bg-primary-500 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-rotate-3 motion-reduce:transition-none"
                           style={{
                              WebkitMaskImage: `url(${departmentIcon(dept.id)})`,
                              maskImage: `url(${departmentIcon(dept.id)})`,
                              WebkitMaskSize: 'contain',
                              maskSize: 'contain',
                              WebkitMaskRepeat: 'no-repeat',
                              maskRepeat: 'no-repeat',
                              WebkitMaskPosition: 'center',
                              maskPosition: 'center',
                           }}
                        />
                        <span className="flex flex-col gap-1">
                           <span className="text-[15px] font-bold leading-snug text-ink-900">{dept.name}</span>
                           <span className="text-[13px] leading-snug text-ink-500">{dept.desc}</span>
                        </span>
                     </button>
                  );
               })
               : symptoms.map((symptom, i) => {
                  const active = selected?.kind === 'symptom' && selected.id === symptom.id;
                  const Icon = symptom.icon;
                  return (
                     <button
                        key={symptom.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => onSelect({ kind: 'symptom', id: symptom.id })}
                        style={{ '--i': Math.min(i, 14) } as React.CSSProperties}
                        className={`${CARD} ${active ? 'border-primary-500 bg-primary-50 shadow-md shadow-primary-500/10' : 'border-ink-100'}`}
                     >
                        <span className="grid size-12 place-items-center rounded-full bg-primary-50 text-primary-600 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-rotate-6 motion-reduce:transition-none">
                           <Icon size={24} strokeWidth={1.75} />
                        </span>
                        <span className="text-[15px] font-bold leading-snug text-ink-900">{symptom.label}</span>
                     </button>
                  );
               })}
         </div>

         {expandable && tab === 'departments' && hiddenCount > 0 && (
            <button
               type="button"
               onClick={() => setShowAll((v) => !v)}
               aria-expanded={showAll}
               className="mx-auto inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-6 py-2.5 text-[15px] font-semibold text-ink-800 transition-colors hover:border-primary-300 hover:text-primary-600"
            >
               {showAll ? 'Show fewer departments' : `Show all ${DEPARTMENTS.length} departments`}
               <ChevronDown size={16} className={`transition-transform duration-300 ${showAll ? 'rotate-180' : ''}`} />
            </button>
         )}
      </section>
   );
};
