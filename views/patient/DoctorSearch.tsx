import React, { useState, useMemo } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { MapPin, Star, GraduationCap } from 'lucide-react';
import { Doctor } from '../../types';
import { getDoctors } from '../../storage';

interface DoctorSearchProps {
  onSelectDoctor: (doctor: Doctor) => void;
}

export const DoctorSearch: React.FC<DoctorSearchProps> = ({ onSelectDoctor }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('All');

  // Fetch ALL doctors from storage
  const doctors = useMemo(() => getDoctors(), []);

  const filteredDoctors = doctors.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          doc.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = specialtyFilter === 'All' || doc.specialty === specialtyFilter;
    return matchesSearch && matchesSpecialty;
  });

  const specialties = ['All', ...Array.from(new Set(doctors.map(d => d.specialty)))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-end md:items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Find a Specialist</h2>
          <p className="text-slate-500">Book appointments with top doctors in your area.</p>
        </div>
      </div>

      {/* Search Bar & Filters */}
      <GlassCard className="p-4 flex flex-col md:flex-row gap-4">
        <input 
          type="text"
          placeholder="Search doctor name or specialty..."
          className="flex-1 bg-white/50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          {specialties.map(spec => (
            <button
              key={spec}
              onClick={() => setSpecialtyFilter(spec)}
              className={`px-4 py-2 rounded-xl whitespace-nowrap transition-colors ${
                specialtyFilter === spec 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white/50 text-slate-600 hover:bg-blue-50'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.map(doctor => (
          <GlassCard key={doctor.id} className="flex flex-col h-full hover:shadow-xl transition-all duration-300">
            <div className="flex gap-4 mb-4">
              <img 
                src={doctor.imageUrl} 
                alt={doctor.name} 
                className="w-20 h-20 rounded-2xl object-cover bg-slate-200"
              />
              <div>
                <h3 className="text-lg font-bold text-slate-900">{doctor.name}</h3>
                <p className="text-teal-600 font-medium text-sm">{doctor.specialty}</p>
                <div className="flex items-center gap-1 text-yellow-500 text-sm mt-1">
                  <Star size={14} fill="currentColor" />
                  <span className="text-slate-600 font-medium">{doctor.rating}</span>
                  <span className="text-slate-400">({doctor.totalPatients}+)</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2 mb-6 flex-1">
              <div className="flex items-start gap-2 text-sm text-slate-600">
                <GraduationCap size={16} className="mt-0.5 shrink-0" />
                <span className="line-clamp-2">{doctor.degrees}</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-slate-600">
                <MapPin size={16} className="mt-0.5 shrink-0" />
                <span className="line-clamp-1">{doctor.chambers[0]?.name}</span>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Visiting Fee</p>
                <p className="text-lg font-bold text-slate-800">৳ {doctor.chambers[0]?.fee}</p>
              </div>
              <Button onClick={() => onSelectDoctor(doctor)}>View Profile</Button>
            </div>
          </GlassCard>
        ))}

        {filteredDoctors.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500">
            No doctors found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
};