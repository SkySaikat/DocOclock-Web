import React, { useState, useEffect, useMemo } from 'react';
import { 
    Search, ArrowLeft, SlidersHorizontal, MapPin, 
    Star, ShieldCheck, ChevronRight, X, Filter 
} from 'lucide-react';
import { Doctor } from '../../types';
import { fetchDoctors } from '../../storage';
import { DoctorCard } from '../../components/ui/DoctorCard';
import { Button } from '../../components/ui/Button';

interface DoctorSearchViewProps {
    onNavigate: (path: string) => void;
    onSelectDoctor: (doctor: Doctor) => void;
    initialCategory?: string;
}

export const DoctorSearchView: React.FC<DoctorSearchViewProps> = ({ 
    onNavigate, 
    onSelectDoctor,
    initialCategory = 'All'
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(initialCategory);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const categories = [
        'All', 'General Physician', 'Cardiology', 'Pediatrics', 'Dermatology', 
        'Internal Medicine', 'Endocrinology', 'Neurology', 'Gastroenterology', 
        'Orthopedics', 'Oncology', 'Gynecology', 'ENT', 'Psychiatry', 
        'Ophthalmology', 'Nephrology', 'Pulmonology', 'Hematology'
    ];

    useEffect(() => {
        const loadDoctors = async () => {
            setIsLoading(true);
            try {
                const data = await fetchDoctors();
                setDoctors(data);
            } catch (err) {
                console.error('Error fetching doctors:', err);
            } finally {
                setIsLoading(false);
            }
        };
        loadDoctors();
    }, []);

    // Strips common medical specialty suffixes to get a comparable stem.
    // e.g. "Cardiologist" → "cardio", "Cardiology" → "cardio", "Pediatrician" → "pediat"
    const specialtyStem = (s: string) =>
        s.toLowerCase().replace(/ologist$|ologist$|ician$|ology$|ics$|ist$|ian$|y$/, '').slice(0, 6);

    const filteredDoctors = useMemo(() => {
        return doctors.filter(doc => {
            const matchesSearch = searchTerm === '' ||
                doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                doc.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (doc.chambers || []).some(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesCategory = selectedCategory === 'All' ||
                // Exact or substring match (covers most cases)
                doc.specialty.toLowerCase().includes(selectedCategory.toLowerCase()) ||
                selectedCategory.toLowerCase().includes(doc.specialty.toLowerCase()) ||
                // Stem match: handles "Pediatrician" ↔ "Pediatrics", "Cardiologist" ↔ "Cardiology" etc.
                specialtyStem(doc.specialty) === specialtyStem(selectedCategory);

            return matchesSearch && matchesCategory;
        });
    }, [doctors, searchTerm, selectedCategory]);

    return (
        <div className="min-h-screen bg-slate-50/30">
            {/* Header / Search Fixed */}
            <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4 mb-4">
                        <button 
                            onClick={() => onNavigate('/patient/home')}
                            className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">Find Specialists</h1>
                    </div>

                    <div className="flex gap-2">
                        <div className="flex-1 relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                <Search size={18} />
                            </div>
                            <input 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by name, specialty, or hospital..."
                                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-4 font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all"
                            />
                            {searchTerm && (
                                <button 
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                        <button className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition-colors">
                            <SlidersHorizontal size={20} />
                        </button>
                    </div>

                    {/* Horizontal Categories */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar py-4 -mx-4 px-4 mt-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                                    selectedCategory === cat 
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                                    : 'bg-white border border-slate-100 text-slate-500 hover:border-slate-300'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
                        <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Finding Doctors...</p>
                    </div>
                ) : filteredDoctors.length > 0 ? (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">
                                {filteredDoctors.length} {filteredDoctors.length === 1 ? 'Specialist' : 'Specialists'} Found
                            </h2>
                            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs cursor-pointer">
                                <Filter size={14} />
                                <span>Sort: Recommended</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredDoctors.map(doc => (
                                <div key={doc.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div 
                                        onClick={() => onSelectDoctor(doc)}
                                        className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm hover:border-blue-200 transition-all group cursor-pointer flex gap-5"
                                    >
                                        <div className="w-24 h-32 rounded-2xl overflow-hidden bg-slate-50 shrink-0 border border-slate-100">
                                            <img 
                                                src={doc.imageUrl || doc.image || `https://picsum.photos/200/300?random=${doc.id}`} 
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                                alt={doc.name} 
                                            />
                                        </div>
                                        <div className="flex-1 py-1">
                                            <div className="flex items-center gap-1.5 mb-1.5">
                                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest rounded-md">
                                                    {doc.specialty}
                                                </span>
                                                {doc.rating > 4.5 && (
                                                    <span className="flex items-center gap-1 text-amber-500 font-black text-[11px]">
                                                        <Star size={12} fill="currentColor" />
                                                        {doc.rating}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-lg font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors mb-1">
                                                {doc.name}
                                            </h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4 leading-tight">
                                                {doc.degrees || 'MBBS, Specialist'}
                                            </p>
                                            
                                            <div className="flex items-center gap-4 border-t border-slate-50 pt-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black text-slate-900 leading-none">{doc.experienceYears || 10}+ Yrs</span>
                                                    <span className="text-[8px] font-bold text-slate-400 uppercase mt-1">Experience</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black text-slate-900 leading-none">{doc.totalPatients || '2.5k'}+</span>
                                                    <span className="text-[8px] font-bold text-slate-400 uppercase mt-1">Patients</span>
                                                </div>
                                                <div className="ml-auto">
                                                    <button className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                                                        <ChevronRight size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="py-20 text-center animate-in fade-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                            <Search size={40} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900">No Doctors Found</h3>
                        <p className="text-slate-400 font-bold mt-2 max-w-xs mx-auto">
                            We couldn't find any specialists matching "{searchTerm}". Try a different specialty or keyword.
                        </p>
                        <Button 
                            variant="secondary" 
                            className="mt-8"
                            onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
                        >
                            Clear All Filters
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
