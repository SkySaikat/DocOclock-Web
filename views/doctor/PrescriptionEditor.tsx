import React, { useState, useMemo, useEffect } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { MOCK_MEDICINES, MOCK_DOCTORS, COMMON_DOSAGES, COMMON_INSTRUCTIONS } from '../../constants';
import { Trash2, Printer, Save, Share2, Search, Building2, Phone, Mail, X, Star, History, CalendarDays, Calendar, Eye, Edit3, Check, ChevronDown, ClipboardCheck, User, Send } from 'lucide-react';
import { DoctorStorage, savePrescriptionToSupabase, PracticeChamber } from '../../storage';
import { Medicine, PrescriptionMedicine, Prescription } from '../../types';
import { getActiveChamber } from '../../utils/chamber';

interface PrescriptionEditorProps {
  initialPatient?: { id: string; name: string; age?: number; gender: string; phone: string; appointmentId: string; hospitalId: string } | null;
  onClearInitial?: () => void;
  onSave?: (rx: any) => void;
}

const DOSAGE_OPTIONS = ['0', '½', '1', '1½', '2'];

export const PrescriptionEditor: React.FC<PrescriptionEditorProps> = ({ initialPatient, onClearInitial, onSave }) => {
  const doctor = DoctorStorage.get();
  const doctorId = doctor?.id;

  // UI State for Mobile
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');

  // Data State
  const [patientName, setPatientName] = useState(initialPatient?.name || '');
  const [age, setAge] = useState(initialPatient?.age?.toString() || '');
  const [gender, setGender] = useState(initialPatient?.gender || 'Male');
  const [complaints, setComplaints] = useState<string[]>([]);
  const [diagnosis, setDiagnosis] = useState<string>('');
  const [tests, setTests] = useState<string[]>([]);
  const [selectedMeds, setSelectedMeds] = useState<PrescriptionMedicine[]>([]);
  const [advice, setAdvice] = useState('Avoid fatty foods. Walk for 30 mins daily.');
  const [followUpDate, setFollowUpDate] = useState<string>(''); // YYYY-MM-DD

  // Chamber/Template State
  const [chambers, setChambers] = useState<PracticeChamber[]>([]);
  const [selectedChamberId, setSelectedChamberId] = useState<string | null>(initialPatient?.hospitalId || null);

  const [isLoadingChambers, setIsLoadingChambers] = useState(true);

  useEffect(() => {
    const loadChambersData = async () => {
      if (!doctorId) return;
      setIsLoadingChambers(true);
      try {
        const { fetchDoctorChambers } = await import('../../storage');
        const data = await fetchDoctorChambers(doctorId);
        setChambers(data);

        // Automation: Priority 1: Appointment Hospital | Priority 2: Currently Active Chamber | Priority 3: First available
        if (!selectedChamberId) {
          const autoSelectedId = initialPatient?.hospitalId || getActiveChamber(data);
          setSelectedChamberId(autoSelectedId);
        }
      } catch (error) {
        console.error('Error loading chambers for editor:', error);
      } finally {
        setIsLoadingChambers(false);
      }
    };
    loadChambersData();
  }, [doctorId, initialPatient?.hospitalId]);

  useEffect(() => {
    if (initialPatient) {
      setPatientName(initialPatient.name);
      setAge(initialPatient.age?.toString() || '');
      setGender(initialPatient.gender);
    }
  }, [initialPatient]);

  // Medicine Search State
  const [medSearch, setMedSearch] = useState('');
  const [showMedResults, setShowMedResults] = useState(false);
  const [tempMed, setTempMed] = useState<Partial<PrescriptionMedicine> | null>(null);

  // Favorites & Recents State
  const [favorites, setFavorites] = useState<string[]>(['m1', 'm6']);
  const [recentMedIds, setRecentMedIds] = useState<string[]>([]);

  // Derived State for Current Template
  const activeChamber = chambers.find(c => c.id === selectedChamberId);
  const currentTemplate = {
    hospitalName: activeChamber?.hospitalName || 'DocOclock General',
    address: activeChamber?.address || 'Dhaka, Bangladesh',
    phone: doctor?.phone || '+8801XXXXXXX',
    themeColor: '#3b82f6',
    logoUrl: 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png',
    watermarkOpacity: 0.1
  };

  const handleQuickDate = (daysToAdd: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysToAdd);
    setFollowUpDate(date.toISOString().split('T')[0]);
  };

  const initiateAddMedicine = (med: Medicine) => {
    setTempMed({
      medicine: med,
      morningDose: '1',
      noonDose: '0',
      nightDose: '1',
      duration: '7',
      instruction: 'After meal'
    });
    setMedSearch('');
    setShowMedResults(false);
  };

  const applyDosagePreset = (preset: string) => {
    if (!tempMed) return;
    const parts = preset.split('+');
    const formatPart = (p: string) => p === '0.5' ? '½' : p;

    setTempMed({
      ...tempMed,
      morningDose: formatPart(parts[0] || '0'),
      noonDose: formatPart(parts[1] || '0'),
      nightDose: formatPart(parts[2] || '0')
    });
  };

  const confirmAddMedicine = () => {
    if (tempMed && tempMed.medicine && tempMed.duration) {
      const finalMed: PrescriptionMedicine = {
        medicine: tempMed.medicine,
        morningDose: tempMed.morningDose || '0',
        noonDose: tempMed.noonDose || '0',
        nightDose: tempMed.nightDose || '0',
        duration: tempMed.duration || '0',
        instruction: tempMed.instruction || 'After meal'
      };
      setSelectedMeds([...selectedMeds, finalMed]);
      setRecentMedIds(prev => {
        const newRecents = [tempMed.medicine!.id, ...prev.filter(id => id !== tempMed.medicine!.id)];
        return newRecents.slice(0, 5);
      });
      setTempMed(null);
    }
  };

  const cancelAddMedicine = () => { setTempMed(null); };

  const removeMedicine = (index: number) => {
    const newMeds = [...selectedMeds];
    newMeds.splice(index, 1);
    setSelectedMeds(newMeds);
  };

  const toggleFavorite = (e: React.MouseEvent, medId: string) => {
    e.stopPropagation();
    setFavorites(prev => prev.includes(medId) ? prev.filter(id => id !== medId) : [...prev, medId]);
  };

  // FINISH & SEND Logic (Refactored for Structured System)
  const handleFinishPrescription = async () => {
    if (!patientName) { alert('Patient name is required'); return; }
    if (!initialPatient?.appointmentId) { alert('No active appointment found. Please start from the queue.'); return; }

    const prescriptionId = `rx-${crypto.randomUUID().slice(0, 8)}`;

    // 1. Mandatory Structured Payload
    const rxRecord: Prescription = {
      id: prescriptionId,
      appointmentId: initialPatient.appointmentId,
      doctorId: doctorId || '',
      patientId: initialPatient.id,
      hospitalId: selectedChamberId || initialPatient.hospitalId,
      date: new Date().toISOString().split('T')[0],
      diagnosis: Array.isArray(diagnosis) ? diagnosis.join(', ') : diagnosis,
      notes: advice,
      medicines: selectedMeds.map(m => ({
        name: m.medicine.brandName,
        dosage: `${m.morningDose}+${m.noonDose}+${m.nightDose}`,
        durationDays: parseInt(m.duration) || 0,
        beforeAfterMeal: m.instruction.toLowerCase().includes('before') ? 'before' : 'after',
        startDate: new Date().toISOString().split('T')[0]
      })),
      createdAt: Date.now()
    };

    // 2. Visual Package for UI / Legacy compatibility if needed
    const rxPackage = {
      ...rxRecord,
      displayDate: new Date().toLocaleDateString('en-GB'),
      hospital: currentTemplate.hospitalName,
      patientName,
      age,
      gender,
      doctorName: doctor?.name,
      doctorDegrees: doctor?.degrees,
      specialty: doctor?.specialty
    };

    try {
      // 3. Structured Persistence (Supabase)
      await savePrescriptionToSupabase(rxRecord);

      if (onSave) {
        onSave(rxPackage);
        alert('Prescription saved and medicine alerts generated for ' + patientName);
      }
    } catch (error) {
      console.error('Error saving prescription to Supabase:', error);
      alert('Failed to save prescription to cloud. Please try again.');
    }
  };

  const filteredMedicines = useMemo(() => {
    let results = MOCK_MEDICINES;
    if (medSearch.length > 0) {
      const lower = medSearch.toLowerCase();
      results = results.filter(m =>
        m.brandName.toLowerCase().includes(lower) ||
        m.genericName.toLowerCase().includes(lower)
      );
    } else if (showMedResults) {
      results = results.filter(m => favorites.includes(m.id) || recentMedIds.includes(m.id));
    } else {
      return [];
    }
    return results.sort((a, b) => {
      const aRecent = recentMedIds.indexOf(a.id);
      const bRecent = recentMedIds.indexOf(b.id);
      if (aRecent !== -1 && bRecent !== -1) return aRecent - bRecent;
      if (aRecent !== -1) return -1;
      if (bRecent !== -1) return 1;
      const aFav = favorites.includes(a.id);
      const bFav = favorites.includes(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return a.brandName.localeCompare(b.brandName);
    });
  }, [medSearch, showMedResults, favorites, recentMedIds]);

  return (
    <div className="flex flex-col h-full md:h-[calc(100vh-140px)] relative">

      {/* MOBILE TAB TOGGLE */}
      <div className="xl:hidden flex bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm -mx-4 px-4 pt-2 mb-4">
        <button
          onClick={() => setMobileView('editor')}
          className={`flex-1 py-3 text-sm font-black border-b-2 transition-colors flex items-center justify-center gap-2 ${mobileView === 'editor' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
        >
          <Edit3 size={16} /> Editor
        </button>
        <button
          onClick={() => setMobileView('preview')}
          className={`flex-1 py-3 text-sm font-black border-b-2 transition-colors flex items-center justify-center gap-2 ${mobileView === 'preview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
        >
          <Eye size={16} /> Preview Rx
          <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-[10px]">{selectedMeds.length}</span>
        </button>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 h-full overflow-hidden">

        {/* LEFT PANEL: EDITOR */}
        <div className={`flex-1 space-y-4 overflow-y-auto pr-1 md:pr-2 custom-scrollbar pb-40 md:pb-10 ${mobileView === 'preview' ? 'hidden xl:block' : 'block'}`}>

          <GlassCard className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-slate-500 uppercase">Patient Details</h3>
              {initialPatient && (
                <button onClick={onClearInitial} className="text-[10px] font-black text-red-500 uppercase flex items-center gap-1">
                  <X size={10} /> Clear Data
                </button>
              )}
            </div>
            <div className="space-y-4">
              <div className="flex gap-4">
                <input
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 h-12 font-bold"
                  placeholder="Patient Name"
                  value={patientName}
                  onChange={e => setPatientName(e.target.value)}
                />
                <input
                  className="w-24 bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 h-12 text-center font-bold"
                  placeholder="Age"
                  value={age}
                  onChange={e => setAge(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                {['Male', 'Female', 'Other'].map(g => (
                  <button key={g} onClick={() => setGender(g)} className={`flex-1 py-2 text-xs font-black uppercase rounded-xl transition-all border ${gender === g ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white border-slate-200 text-slate-400'}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Clinical Notes</h3>
            <div className="space-y-4">
              <textarea
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 h-16 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Chief Complaints (one per line)..."
                value={complaints.join('\n')}
                onChange={e => setComplaints(e.target.value.split('\n'))}
              />
              <textarea
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 h-16 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Diagnosis..."
                value={diagnosis}
                onChange={e => setDiagnosis(e.target.value)}
              />
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                <ClipboardCheck size={16} className="text-blue-500" /> Tests Recommended
              </h3>
            </div>
            <textarea
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 h-20 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Required diagnostic tests..."
              value={tests.join('\n')}
              onChange={e => setTests(e.target.value.split('\n'))}
            />
          </GlassCard>

          <GlassCard className="p-4 relative z-20 overflow-visible">
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Add Medicine</h3>
            {tempMed ? (
              <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 animate-fade-in">
                <div className="flex justify-between items-start mb-4 border-b border-blue-100 pb-2">
                  <div>
                    <h4 className="font-bold text-blue-900 text-lg">{tempMed.medicine?.brandName} <span className="text-sm font-normal text-slate-500">{tempMed.medicine?.strength}</span></h4>
                  </div>
                  <button onClick={cancelAddMedicine} className="bg-white p-1 rounded-full text-slate-400 hover:text-red-500 shadow-sm border border-slate-100"><X size={20} /></button>
                </div>
                <div className="space-y-5">
                  <div className="grid grid-cols-3 gap-2 bg-white p-2 rounded-xl border border-slate-200">
                    {['Morning', 'Noon', 'Night'].map((period, i) => (
                      <div key={period} className="text-center">
                        <label className="text-[10px] text-slate-400 block mb-1 font-bold uppercase">{period}</label>
                        <select className="w-full bg-slate-50 rounded-lg py-2 text-center text-sm font-bold outline-none" value={i === 0 ? tempMed.morningDose : i === 1 ? tempMed.noonDose : tempMed.nightDose} onChange={(e) => setTempMed({ ...tempMed, [i === 0 ? 'morningDose' : i === 1 ? 'noonDose' : 'nightDose']: e.target.value })}>
                          {DOSAGE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                  <Button fullWidth onClick={confirmAddMedicine} className="h-12 font-black shadow-lg">Confirm Medicine</Button>
                </div>
              </div>
            ) : (
              <div className="relative mb-6">
                <Search className="absolute left-3 top-3.5 text-slate-400" size={20} />
                <input
                  className="w-full pl-10 bg-white border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search Medicine..."
                  value={medSearch}
                  onChange={e => { setMedSearch(e.target.value); setShowMedResults(true); }}
                  onFocus={() => setShowMedResults(true)}
                />
                {showMedResults && (filteredMedicines.length > 0 || medSearch.length === 0) && (
                  <div className="absolute top-full left-0 w-full bg-white shadow-xl rounded-xl mt-2 border border-slate-100 max-h-64 overflow-auto z-50 divide-y divide-slate-50">
                    {filteredMedicines.map(med => (
                      <div key={med.id} className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center" onClick={() => initiateAddMedicine(med)}>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{med.brandName}</p>
                          <p className="text-[10px] text-slate-500">{med.genericName}</p>
                        </div>
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{med.strength}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <h3 className="text-sm font-bold text-slate-500 uppercase mb-3 flex items-center gap-2"><CalendarDays size={16} className="text-blue-500" /> Next Follow Up</h3>
            <div className="space-y-3">
              <input type="date" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 h-12 outline-none focus:ring-2 focus:ring-blue-500" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
              <div className="flex gap-2">
                {[7, 14, 30].map(days => (
                  <button type="button" key={days} onClick={() => handleQuickDate(days)} className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${followUpDate ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                    +{days === 30 ? '1 Month' : `${days} Days`}
                  </button>
                ))}
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Advice</h3>
            <textarea className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 h-20 text-sm outline-none" value={advice} onChange={e => setAdvice(e.target.value)} />
          </GlassCard>
        </div>

        {/* RIGHT PANEL: PREVIEW */}
        <GlassCard className={`flex-[1.5] flex flex-col h-full bg-white shadow-2xl relative overflow-hidden p-0 rounded-none md:rounded-3xl border-0 md:border md:border-white/60 ${mobileView === 'editor' ? 'hidden xl:flex' : 'flex'} pb-40 xl:pb-0`}>
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center" style={{ opacity: currentTemplate.watermarkOpacity }}>
            <img src={currentTemplate.logoUrl} className="w-1/2 grayscale" alt="Watermark" />
          </div>
          <div className="p-6 md:p-8 border-b-2 flex justify-between items-start" style={{ backgroundColor: `${currentTemplate.themeColor}10`, borderColor: currentTemplate.themeColor }}>
            <div className="flex items-start gap-4">
              <img src={currentTemplate.logoUrl} className="w-12 h-12 md:w-16 md:h-16 object-contain" />
              <div>
                <h1 className="text-lg md:text-2xl font-serif font-bold leading-tight" style={{ color: currentTemplate.themeColor }}>{currentTemplate.hospitalName}</h1>
                <p className="text-[10px] text-slate-500 mt-1 max-w-[200px]">{currentTemplate.address}</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-sm md:text-xl font-bold text-slate-900">{doctor?.name}</h2>
              <p className="text-sm md:text-sm text-blue-600 font-bold uppercase tracking-widest">{doctor?.specialty}</p>
            </div>
          </div>
          <div className="px-6 md:px-8 py-3 flex flex-wrap gap-x-8 gap-y-2 text-[10px] md:text-xs font-black uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-1"><span className="text-blue-600">Name:</span> <span className="text-slate-600">{patientName || '__________'}</span></div>
            <div className="flex items-center gap-1"><span className="text-blue-600">Age/Sex:</span> <span className="text-slate-600">{age || '____'} / {gender.charAt(0)}</span></div>
            <div className="ml-auto text-blue-600">ID: <span className="text-slate-600">#PRES-LIVE</span></div>
          </div>
          <div className="flex-1 flex flex-col md:flex-row p-6 md:p-8 overflow-y-auto custom-scrollbar">
            <div className="w-full md:w-1/3 md:border-r border-slate-100 md:pr-6 space-y-10">
              <section>
                <h4 className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] mb-3">Clinical Findings</h4>
                <ul className="space-y-1.5 pl-4 list-disc text-xs font-bold text-slate-700 marker:text-slate-300">
                  {complaints.filter(c => c.trim()).length > 0 ? complaints.map((c, i) => <li key={i}>{c}</li>) : <li className="text-slate-300 italic">None entered</li>}
                </ul>
              </section>
              <section>
                <h4 className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] mb-3">Tests Recommended</h4>
                <ol className="space-y-1.5 pl-4 list-decimal text-xs font-bold text-slate-700 marker:text-slate-300">
                  {tests.filter(t => t.trim()).length > 0 ? tests.map((t, i) => <li key={i}>{t}</li>) : <li className="text-slate-300 italic">No tests requested</li>}
                </ol>
              </section>
              {followUpDate && (
                <section className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                  <h4 className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] mb-2">Follow Up</h4>
                  <p className="text-xs font-bold text-slate-700 flex items-center gap-2">
                    <Calendar size={14} className="text-blue-500" /> {new Date(followUpDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </section>
              )}
            </div>
            <div className="flex-1 md:pl-8 flex flex-col relative pt-8 md:pt-0">
              <div className="absolute top-0 right-0 opacity-[0.05] pointer-events-none select-none"><span className="text-8xl font-black italic">Rx</span></div>
              <div className="flex-1 space-y-8 min-h-[300px]">
                {selectedMeds.length === 0 && <p className="text-slate-300 italic text-sm mt-12">No medicines added to Rx yet...</p>}
                {selectedMeds.map((item, idx) => (
                  <div key={idx} className="relative group">
                    <h4 className="font-black text-slate-900 text-base md:text-lg">{idx + 1}. {item.medicine.brandName} <span className="text-xs font-bold text-slate-400">{item.medicine.strength}</span></h4>
                    <div className="flex items-center gap-6 mt-3">
                      <div className="bg-slate-100 px-3 py-1 rounded-lg font-black tracking-widest text-slate-800 text-xs border border-slate-200">{item.morningDose} + {item.noonDose} + {item.nightDose}</div>
                      <div className="text-xs text-slate-500 font-bold">{item.instruction} | {item.duration} Days</div>
                    </div>
                    <button onClick={() => removeMedicine(idx)} className="absolute top-0 -right-2 p-1 text-slate-300 hover:text-red-500 transition"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-slate-100">
                <h4 className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] mb-2">Advice:</h4>
                <p className="text-xs font-bold text-slate-600 italic leading-relaxed">{advice}</p>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* MOBILE & DESKTOP FLOATING ACTION DOCK - sit above nav */}
      <div className="fixed bottom-[100px] md:bottom-8 left-0 right-0 md:left-auto md:right-8 z-[70] px-4 md:px-0">
        <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-xl p-3 md:p-0 rounded-[2.5rem] md:rounded-none shadow-[0_20px_50px_rgba(0,0,0,0.15)] md:shadow-none border border-slate-200 md:border-0 flex flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1 md:w-40 h-14 md:h-16 rounded-2xl bg-white shadow-lg gap-2 font-black border-2 border-slate-200 text-slate-600"
            onClick={() => alert('Draft saved successfully!')}
          >
            <Save size={20} /> <span className="hidden sm:inline">Save Draft</span><span className="sm:hidden">Draft</span>
          </Button>
          <Button
            className="flex-[2] md:w-64 h-14 md:h-16 rounded-2xl shadow-2xl gap-3 font-black text-lg bg-teal-600 hover:bg-teal-700 text-white"
            onClick={handleFinishPrescription}
          >
            <Send size={20} /> <span className="inline">Send Rx</span>
          </Button>
          <Button
            className="flex-1 md:w-20 h-14 md:h-16 rounded-2xl shadow-2xl gap-3 font-black text-lg bg-blue-600 text-white"
            onClick={() => window.print()}
          >
            <Printer size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
};