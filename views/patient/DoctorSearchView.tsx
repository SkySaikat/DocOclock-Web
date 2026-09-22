import React, { useEffect, useMemo, useState } from 'react';
import { Search, X, ChevronDown, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { SortMenu } from '../../components/dashboard';
import { useMenu } from '../../components/patient/DsTable';
import { Doctor } from '../../types';
import { fetchDoctors } from '../../storage';
import { DoctorCard } from '../../components/ui/DoctorCard';

interface DoctorSearchViewProps {
    onNavigate: (path: string) => void;
    onSelectDoctor: (doctor: Doctor) => void;
    initialCategory?: string;
}

const SPECIALTIES = ['All', 'Cardiologist', 'Dentist', 'Orthopedics', 'Surgeon', 'Neurologist', 'Dermatologist', 'Pediatrics'];
const EXPERIENCE_BANDS = [
    { label: 'Any Experience', test: () => true },
    { label: 'Less than 1 Year', test: (y: number) => y < 1 },
    { label: '1 - 5 Years', test: (y: number) => y >= 1 && y <= 5 },
    { label: '5 - 10 Years', test: (y: number) => y > 5 && y <= 10 },
    { label: '10+ Years', test: (y: number) => y > 10 },
];

export const DoctorSearchView: React.FC<DoctorSearchViewProps> = ({
    onNavigate,
    onSelectDoctor,
    initialCategory = 'All'
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState(initialCategory === 'All' ? 'All' : initialCategory);
    const [selectedExperience, setSelectedExperience] = useState(0);
    const [isTypeOpen, setIsTypeOpen] = useState(false);
    const [isExpOpen, setIsExpOpen] = useState(false);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // Figma List Page 396:12430: "Sort By Recommendation" + numbered pagination (presentational over the filtered list).
    const [sortBy, setSortBy] = useState<SortKey>('recommended');
    const [page, setPage] = useState(1);
    const sortMenu = useMenu();
    const typeMenu = useMenu();
    const expMenu = useMenu();

    useEffect(() => {
        fetchDoctors().then(setDoctors).catch((err) => console.error('Error fetching doctors:', err)).finally(() => setIsLoading(false));
    }, []);

    const specialtyStem = (s: string) => s.toLowerCase().replace(/ologist$|ician$|ology$|ics$|ist$|ian$|y$/, '').slice(0, 6);

    const filteredDoctors = useMemo(() => {
        const expBand = EXPERIENCE_BANDS[selectedExperience];
        return doctors.filter((doc) => {
            const matchesSearch = searchTerm === '' ||
                doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                doc.specialty.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = selectedType === 'All' ||
                doc.specialty.toLowerCase().includes(selectedType.toLowerCase()) ||
                specialtyStem(doc.specialty) === specialtyStem(selectedType);
            const matchesExperience = expBand.test(doc.experienceYears || 0);
            return matchesSearch && matchesType && matchesExperience;
        });
    }, [doctors, searchTerm, selectedType, selectedExperience]);

    const sorted = useMemo(() => {
        const list = [...filteredDoctors];
        if (sortBy === 'rating') list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        if (sortBy === 'experience') list.sort((a, b) => expOf(b) - expOf(a));
        if (sortBy === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
        return list;
    }, [filteredDoctors, sortBy]);
    const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    const safePage = Math.min(page, pageCount);
    const pageDoctors = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
    const from = sorted.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
    const to = Math.min(sorted.length, safePage * PAGE_SIZE);
    const resetAll = () => { setSearchTerm(''); setSelectedType('All'); setSelectedExperience(0); setSortBy('recommended'); setPage(1); };

    return (
        // Figma "List Page" 396:12430 (booking flow step 1): filters row, results line + sort, reveal cards, numbered pagination.
        <div className="mx-auto flex w-full max-w-[1312px] flex-col gap-6 px-4 py-8 font-display md:px-6 md:py-12">
            <h1 className="text-[28px] font-normal leading-[normal] text-content-primary md:text-ds-h36">Find a Doctor</h1>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={resetAll} className="flex h-12 items-center gap-2 rounded-full border border-content-secondary/60 px-4 text-ds-paragraph text-content-secondary transition-colors duration-ds-fast ease-ds-out hover:border-primary-500 hover:text-primary-600" title="Reset filters and sort">
                        <SlidersHorizontal size={16} /> Filter &amp; Sort
                    </button>
                    <span aria-hidden="true" className="mx-1 h-8 w-px bg-ink-200" />
                    <div ref={typeMenu.ref} className="relative">
                        <button type="button" aria-haspopup="menu" aria-expanded={typeMenu.open} onClick={() => { typeMenu.setOpen(o => !o); expMenu.close(); }} className={PILL}>
                            {selectedType === 'All' ? 'Type' : selectedType} <ChevronDown size={16} className={`transition-transform duration-ds-fast ${typeMenu.open ? 'rotate-180' : ''}`} />
                        </button>
                        {typeMenu.open && <SortMenu options={SPECIALTIES.map(sp => ({ id: sp, label: sp }))} value={selectedType} onSelect={id => { setSelectedType(id); setPage(1); }} onClose={typeMenu.close} className="w-[180px]" />}
                    </div>
                    <div ref={expMenu.ref} className="relative">
                        <button type="button" aria-haspopup="menu" aria-expanded={expMenu.open} onClick={() => { expMenu.setOpen(o => !o); typeMenu.close(); }} className={PILL}>
                            {selectedExperience === 0 ? 'Experience' : EXPERIENCE_BANDS[selectedExperience].label} <ChevronDown size={16} className={`transition-transform duration-ds-fast ${expMenu.open ? 'rotate-180' : ''}`} />
                        </button>
                        {expMenu.open && <SortMenu options={EXPERIENCE_BANDS.map((b, i) => ({ id: String(i), label: b.label }))} value={String(selectedExperience)} onSelect={id => { setSelectedExperience(Number(id)); setPage(1); }} onClose={expMenu.close} className="w-[180px]" />}
                    </div>
                </div>

                <label className="relative flex h-14 w-full items-center rounded-full bg-white pl-5 pr-1 shadow-ds-pill lg:w-[652px]">
                    <input
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        placeholder="What are you looking for?"
                        aria-label="Search doctors"
                        className="min-w-0 flex-1 bg-transparent text-ds-paragraph text-content-primary outline-none placeholder:text-content-secondary"
                    />
                    {searchTerm && (
                        <button type="button" onClick={() => setSearchTerm('')} aria-label="Clear search" className="mr-2 text-content-tertiary hover:text-content-primary"><X size={16} /></button>
                    )}
                    <span aria-hidden="true" className="grid size-12 place-items-center rounded-full bg-primary-500 text-white"><Search size={18} /></span>
                </label>
            </div>

            <div className="flex items-center justify-between gap-3">
                <p className="text-ds-paragraph text-content-primary" aria-live="polite">
                    {isLoading ? 'Finding doctors...' : `Showing ${from}-${to} of ${sorted.length} results`}
                </p>
                <div ref={sortMenu.ref} className="relative">
                    <button type="button" aria-haspopup="menu" aria-expanded={sortMenu.open} onClick={() => sortMenu.setOpen(o => !o)} className="flex h-12 items-center gap-6 rounded-full border border-ink-100 px-3 text-ds-paragraph text-content-primary">
                        {SORTS.find(o => o.id === sortBy)?.label} <ChevronDown size={18} />
                    </button>
                    {sortMenu.open && <SortMenu options={SORTS} value={sortBy} onSelect={id => { setSortBy(id as SortKey); setPage(1); }} onClose={sortMenu.close} className="left-auto right-0 w-full" />}
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center gap-4 py-24">
                    <div className="size-10 animate-spin rounded-full border-4 border-primary-100 border-t-primary-500" />
                </div>
            ) : pageDoctors.length > 0 ? (
                <div className="grid grid-cols-1 justify-items-center gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                    {pageDoctors.map((doc) => (
                        <DoctorCard
                            key={doc.id}
                            reveal
                            doctor={{
                                name: doc.name,
                                specialty: doc.specialty,
                                degrees: doc.degrees,
                                bmdcNumber: doc.bmdcNumber || '',
                                // the profile rows carry snake_case columns at runtime (experience_years / total_patients)
                                experience: doc.experienceYears || (doc as any).experience_years,
                                totalPatients: doc.totalPatients || (doc as any).total_patients,
                                rating: doc.rating,
                                image: doc.imageUrl,
                            }}
                            onClick={() => onSelectDoctor(doc)}
                            onCtaClick={() => onSelectDoctor(doc)}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center gap-3 py-24 text-center">
                    <span className="grid size-16 place-items-center rounded-full bg-ink-50 text-ink-300"><Search size={28} /></span>
                    <h3 className="text-ds-title-20 text-content-primary">No Doctors Found</h3>
                    <p className="max-w-xs text-ds-body text-content-tertiary">Try a different specialty, experience range, or search term.</p>
                    <button onClick={resetAll} className="btn-sheen relative mt-3 h-11 overflow-hidden rounded-full bg-primary-500 px-6 text-ds-body text-white">Clear All Filters</button>
                </div>
            )}

            {pageCount > 1 && <Pager page={safePage} count={pageCount} onPage={setPage} />}
        </div>
    );
};

const PAGE_SIZE = 9;
type SortKey = 'recommended' | 'rating' | 'experience' | 'name';
const SORTS: { id: SortKey; label: string }[] = [
    { id: 'recommended', label: 'Sort By Recommendation' },
    { id: 'rating', label: 'Highest Rated' },
    { id: 'experience', label: 'Most Experienced' },
    { id: 'name', label: 'Name (A–Z)' },
];
const expOf = (d: Doctor) => d.experienceYears || (d as any).experience_years || 0;
const PILL = 'flex h-12 items-center gap-2 rounded-full border border-ink-100 bg-transparent px-4 text-ds-paragraph text-content-secondary transition-colors duration-ds-fast ease-ds-out hover:border-primary-300';

// Numbered pagination (Figma: chevrons, plain numbers, 56px primary square for the current page, "…" gaps).
const Pager: React.FC<{ page: number; count: number; onPage: (p: number) => void }> = ({ page, count, onPage }) => {
    const pages = Array.from(new Set([1, page - 1, page, page + 1, count])).filter(p => p >= 1 && p <= count).sort((a, b) => a - b);
    const items: (number | '…')[] = [];
    pages.forEach((p, i) => { if (i > 0 && p - pages[i - 1] > 1) items.push('…'); items.push(p); });
    return (
        <nav aria-label="Pagination" className="flex items-center justify-center gap-4 pt-4">
            <button type="button" onClick={() => onPage(Math.max(1, page - 1))} disabled={page <= 1} aria-label="Previous page" className="grid size-10 place-items-center text-content-primary disabled:opacity-30"><ChevronLeft size={18} /></button>
            {items.map((it, i) => it === '…'
                ? <span key={`gap-${i}`} className="text-content-secondary">…</span>
                : <button key={it} type="button" onClick={() => onPage(it)} aria-current={it === page ? 'page' : undefined}
                    className={`grid size-14 place-items-center rounded-2xl text-ds-body transition-colors duration-ds-fast ease-ds-out ${it === page ? 'bg-primary-500 text-white' : 'text-content-secondary hover:bg-ink-50'}`}>{it}</button>)}
            <button type="button" onClick={() => onPage(Math.min(count, page + 1))} disabled={page >= count} aria-label="Next page" className="grid size-10 place-items-center text-content-primary disabled:opacity-30"><ChevronRight size={18} /></button>
        </nav>
    );
};
