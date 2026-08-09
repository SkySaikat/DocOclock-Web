import React, { useEffect, useMemo, useState } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
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

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-16">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div>
                        <span className="inline-flex items-center gap-2.5 mb-4">
                            <span className="w-[21px] h-2 rounded-full bg-medical-500" />
                            <span className="text-ink-500 text-[14px]">Specialists</span>
                        </span>
                        <h1 className="font-display font-normal text-[32px] md:text-[46px] text-[#131215] leading-tight tracking-[0.92px]">Find The Right Doctor</h1>
                    </div>
                    <p className="text-ink-500 text-[15px] max-w-[380px] leading-relaxed">
                        Dococlock connects patients with verified healthcare professionals, making it easy to find specialists, book appointments, and manage healthcare with a fast, secure, and user-friendly experience.
                    </p>
                </div>

                {/* Filter row — exact Figma structure: Type / Experience dropdowns + search */}
                <div className="flex flex-wrap items-center gap-3 mb-10">
                    <div className="relative">
                        <button onClick={() => { setIsTypeOpen((v) => !v); setIsExpOpen(false); }} className="h-12 px-5 rounded-full bg-white shadow-ds-card flex items-center gap-2 text-[14px] text-ink-700 font-medium hover:shadow-ds-soft transition-shadow">
                            Type: {selectedType} <ChevronDown size={14} className={`transition-transform ${isTypeOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isTypeOpen && (
                            <div className="absolute top-[calc(100%+8px)] left-0 bg-white rounded-2xl shadow-ds-soft border border-ink-50 overflow-hidden z-20 w-56">
                                {SPECIALTIES.map((s) => (
                                    <button key={s} onClick={() => { setSelectedType(s); setIsTypeOpen(false); }} className="w-full text-left px-5 py-3 text-[14px] text-ink-700 hover:bg-medical-50 transition-colors">{s}</button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="relative">
                        <button onClick={() => { setIsExpOpen((v) => !v); setIsTypeOpen(false); }} className="h-12 px-5 rounded-full bg-white shadow-ds-card flex items-center gap-2 text-[14px] text-ink-700 font-medium hover:shadow-ds-soft transition-shadow">
                            Experience: {EXPERIENCE_BANDS[selectedExperience].label} <ChevronDown size={14} className={`transition-transform ${isExpOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isExpOpen && (
                            <div className="absolute top-[calc(100%+8px)] left-0 bg-white rounded-2xl shadow-ds-soft border border-ink-50 overflow-hidden z-20 w-56">
                                {EXPERIENCE_BANDS.map((band, i) => (
                                    <button key={band.label} onClick={() => { setSelectedExperience(i); setIsExpOpen(false); }} className={`w-full text-left px-5 py-3 text-[14px] transition-colors ${i === selectedExperience ? 'bg-medical-50 text-medical-600 font-semibold' : 'text-ink-700 hover:bg-medical-50'}`}>{band.label}</button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-[200px] relative">
                        <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-ink-400" />
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="What are you looking for?"
                            className="w-full h-12 pl-12 pr-10 rounded-full bg-white shadow-ds-card outline-none text-[14px] text-ink-800 placeholder:text-ink-400"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700">
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Results grid — same compact card as the homepage "Meet Our Medical Experts" */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-10 h-10 border-4 border-ink-100 border-t-medical-500 rounded-full animate-spin" />
                        <p className="text-ink-400 text-sm">Finding doctors...</p>
                    </div>
                ) : filteredDoctors.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                        {filteredDoctors.map((doc) => (
                            <DoctorCard
                                key={doc.id}
                                compact
                                doctor={{
                                    name: doc.name,
                                    specialty: doc.specialty,
                                    bmdcNumber: doc.bmdcNumber || '',
                                    rating: doc.rating,
                                    image: doc.imageUrl,
                                }}
                                onClick={() => onSelectDoctor(doc)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="py-24 text-center">
                        <div className="w-16 h-16 bg-ink-50 rounded-full flex items-center justify-center mx-auto mb-5 text-ink-300">
                            <Search size={28} />
                        </div>
                        <h3 className="font-display text-xl font-bold text-ink-800">No Doctors Found</h3>
                        <p className="text-ink-500 mt-2 max-w-xs mx-auto text-sm">
                            Try a different specialty, experience range, or search term.
                        </p>
                        <button
                            onClick={() => { setSearchTerm(''); setSelectedType('All'); setSelectedExperience(0); }}
                            className="mt-6 h-11 px-6 rounded-full bg-medical-500 text-white text-sm font-semibold hover:bg-medical-600 transition-colors"
                        >
                            Clear All Filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
