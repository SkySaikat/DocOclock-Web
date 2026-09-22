import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Trash2, Printer, Search, X, Star, Calendar, Eye, Edit3, Check, ChevronDown, Plus, Loader2, Tag } from 'lucide-react';
import { useToast } from '../../components/ToastProvider';
import { DashboardButton, MaskIcon } from '../../components/dashboard';
import { DoctorPrescriptionList } from '../../components/doctor/prescriptions/DoctorPrescriptionList';
import { DoctorStorage, savePrescriptionToSupabase, createPharmacyOrder, PracticeChamber, fetchMedicineCatalog, addMedicineToCatalog } from '../../storage';
import { Medicine, PrescriptionMedicine, Prescription } from '../../types';
import { getActiveChamber } from '../../utils/chamber';
import { downloadPrescriptionPDF } from '../../pdf/prescriptions';

const MEDICINE_CATEGORIES = [
  'Antibiotic','Analgesic','NSAID','Antihistamine','Antacid/PPI','Antidiabetic',
  'Antihypertensive','Antiplatelet','Statin','Supplement','Bronchodilator',
  'Antiasthmatic','Antifungal','Corticosteroid','Antidepressant','Anxiolytic','General'
];
const MEDICINE_FORMS = ['Tablet','Capsule','Syrup','Suspension','Injection','Cream','Ointment','Inhaler','Drop','Suppository'];

interface PrescriptionEditorProps {
  initialPatient?: { id: string; name: string; age?: number; gender: string; phone: string; appointmentId: string; hospitalId: string } | null;
  onClearInitial?: () => void;
  onSave?: (rx: any) => void;
}

const DOSAGE_OPTIONS = ['0', '½', '1', '1½', '2'];

export const PrescriptionEditor: React.FC<PrescriptionEditorProps> = ({ initialPatient, onClearInitial, onSave }) => {
  const doctor = DoctorStorage.get();
  const doctorId = doctor?.id;

  const { showToast } = useToast();

  // UI State for Mobile
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');
  // Figma 307:13617 list first; the 3-step wizard (257:13749 → 257:13781 → 317:15542) opens from "Add Prescription" or the queue.
  const [composing, setComposing] = useState<boolean>(!!initialPatient);
  const [step, setStep] = useState<0 | 1 | 2>(0);
  useEffect(() => { if (initialPatient) { setComposing(true); setStep(0); } }, [initialPatient]);

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
  const [selectedTemplate, setSelectedTemplate] = useState<'modern' | 'classic' | 'minimal'>('modern');

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

  // Medicine Catalog
  const [catalog, setCatalog] = useState<Medicine[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Add-to-catalog state
  const [addingToCatalog, setAddingToCatalog] = useState(false);
  const [newMedForm, setNewMedForm] = useState({ name: '', generic_name: '', category: 'General', form: 'Tablet', strength: '', manufacturer: '' });
  const [savingNewMed, setSavingNewMed] = useState(false);

  // Medicine Search State
  const [medSearch, setMedSearch] = useState('');
  const [showMedResults, setShowMedResults] = useState(false);
  const [tempMed, setTempMed] = useState<Partial<PrescriptionMedicine> | null>(null);

  // Favorites & Recents (per-doctor localStorage persistence)
  const favKey = `rx_fav_${doctorId || 'doc'}`;
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(favKey) || '[]'); } catch { return []; }
  });
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

  // Load medicine catalog (with sessionStorage cache)
  useEffect(() => {
    setCatalogLoading(true);
    const cached = sessionStorage.getItem('medicine_catalog');
    if (cached) {
      try {
        const parsed: any[] = JSON.parse(cached);
        // DB rows have `name`; mapped rows have `brandName` — normalise both
        setCatalog(parsed.map((m: any) => m.brandName ? m : {
          id: m.id, brandName: m.name, genericName: m.generic_name || '',
          type: m.category || 'General', strength: m.strength || '',
          company: m.manufacturer || '', route: m.form || 'Tablet',
        }));
        setCatalogLoading(false);
        return;
      } catch {}
    }
    fetchMedicineCatalog().then(data => {
      setCatalog(data);
      setCatalogLoading(false);
    }).catch(() => setCatalogLoading(false));
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(favKey, JSON.stringify(favorites));
  }, [favorites, favKey]);

  const handleAddToCatalog = async () => {
    if (!newMedForm.name.trim()) return;
    setSavingNewMed(true);
    try {
      const added = await addMedicineToCatalog({ ...newMedForm, added_by_doctor_id: doctorId || undefined });
      setCatalog(prev => [...prev, added].sort((a, b) => a.brandName.localeCompare(b.brandName)));
      setAddingToCatalog(false);
      setNewMedForm({ name: '', generic_name: '', category: 'General', form: 'Tablet', strength: '', manufacturer: '' });
      // Auto-select the new medicine for dosage entry
      initiateAddMedicine(added);
    } catch (err: any) {
      showToast('Could not add medicine: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setSavingNewMed(false);
    }
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
    if (!patientName) { showToast('Patient name is required', 'warning'); setStep(0); return; }
    if (!initialPatient?.appointmentId) { showToast('No active appointment found. Please start from the queue.', 'warning'); return; }

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
      clinicalFindings: complaints.filter(c => c.trim()).join('\n'),
      testsRecommended: tests.filter(t => t.trim()).join('\n'),
      followUpDate: followUpDate || undefined,
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

      // 4. Auto-create pharmacy order (fire and show order number)
      let pharmacyOrderNumber = '';
      try {
        const diagnosisStr = Array.isArray(diagnosis) ? diagnosis.join(', ') : diagnosis || '';
        pharmacyOrderNumber = await createPharmacyOrder(
          rxRecord,
          patientName,
          initialPatient?.phone || '',
          doctor?.name || '',
          diagnosisStr
        );
      } catch (pharmErr) {
        console.warn('Pharmacy order creation failed (non-critical):', pharmErr);
      }

      if (onSave) {
        onSave(rxPackage);
        const pharmMsg = pharmacyOrderNumber
          ? `\n\nPharmacy Order ID: ${pharmacyOrderNumber}\nPatient can collect medicines at the store using this ID.`
          : '';
        showToast(`Prescription saved for ${patientName}.${pharmMsg.replace(/\n+/g, ' ')}`, 'success', 6000);
      }
    } catch (error) {
      console.error('Error saving prescription to Supabase:', error);
      showToast('Failed to save prescription to cloud. Please try again.', 'error');
    }
  };

  const catalogCategories = useMemo(() => {
    const cats = new Set(catalog.map(m => m.type).filter(Boolean));
    return ['All', ...Array.from(cats).sort()];
  }, [catalog]);

  const filteredMedicines = useMemo(() => {
    let results = catalog;
    if (categoryFilter !== 'All') results = results.filter(m => m.type === categoryFilter);
    if (medSearch.length > 0) {
      const lower = medSearch.toLowerCase();
      results = results.filter(m =>
        m.brandName.toLowerCase().includes(lower) ||
        (m.genericName || '').toLowerCase().includes(lower) ||
        (m.company || '').toLowerCase().includes(lower)
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
      if (favorites.includes(a.id) && !favorites.includes(b.id)) return -1;
      if (!favorites.includes(a.id) && favorites.includes(b.id)) return 1;
      return a.brandName.localeCompare(b.brandName);
    });
  }, [medSearch, showMedResults, favorites, recentMedIds, catalog, categoryFilter]);

  const printPdf = () => {
    const rxData = {
      id: `rx-${crypto.randomUUID().slice(0, 8)}`,
      date: new Date().toLocaleDateString('en-GB'),
      patientName,
      patientAge: age,
      patientGender: gender,
      doctorName: doctor?.name || '',
      doctorDegrees: doctor?.degrees || '',
      specialty: doctor?.specialty || '',
      hospitalName: currentTemplate.hospitalName,
      hospitalAddress: currentTemplate.address,
      hospitalPhone: currentTemplate.phone,
      diagnosis,
      complaints,
      tests,
      advice,
      medicines: selectedMeds.map(m => ({
        name: m.medicine.brandName,
        dosage: `${m.morningDose}+${m.noonDose}+${m.nightDose}`,
        duration: `${m.duration} Days`,
        instruction: m.instruction
      })),
      followUpDate: followUpDate || undefined
    };
    downloadPrescriptionPDF(rxData as any, selectedTemplate);
  };

  const toggleTest = (t: string) => {
    const clean = tests.filter(x => x.trim());
    setTests(clean.includes(t) ? clean.filter(x => x !== t) : [...clean, t]);
  };

  if (!composing) return <DoctorPrescriptionList doctorId={doctorId} onAdd={() => { setComposing(true); setStep(0); }} />;

  return (
    // Figma Prescription wizard (257:13749 / 257:13781 / 317:15542): header + 3-step progress, preview (left) + step card (436, right).
    <div className="flex animate-fade-in flex-col gap-6 font-display">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-[24px] font-normal leading-[normal] text-content-primary lg:text-ds-h36">Prescriptions</h1>
          <p className="text-ds-subtitle text-content-tertiary max-lg:text-ds-small">Create and share prescription with your patients</p>
        </div>
        <StepProgress step={step} onStep={setStep} />
      </div>

      {/* Phone: Editor / Preview switch */}
      <div className="flex rounded-full bg-white p-1 xl:hidden" role="tablist">
        {(['editor', 'preview'] as const).map(v => (
          <button key={v} role="tab" aria-selected={mobileView === v} onClick={() => setMobileView(v)}
            className={`flex h-10 flex-1 items-center justify-center gap-2 rounded-full text-ds-body transition-colors duration-ds-fast ease-ds-out ${mobileView === v ? 'bg-primary-500 text-white' : 'text-content-tertiary'}`}>
            {v === 'editor' ? <><Edit3 size={14} /> Editor</> : <><Eye size={14} /> Preview Rx <span className={`rounded-full px-1.5 text-[10px] ${mobileView === v ? 'bg-white/20' : 'bg-primary-50 text-primary-600'}`}>{selectedMeds.length}</span></>}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-stretch">
        {/* LEFT: live Rx preview (Figma placeholder area) */}
        <section aria-label="Prescription preview" className={`min-w-0 flex-1 flex-col gap-4 rounded-ds-lg bg-white p-5 ${mobileView === 'editor' ? 'hidden xl:flex' : 'flex'}`}>
          <div className="flex items-center justify-end gap-2">
            <label className="flex h-10 items-center gap-2 rounded-full bg-ink-50 px-3 text-ds-small text-content-secondary">
              Template
              <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value as any)} className="bg-transparent text-content-primary outline-none">
                <option value="modern">Modern</option>
                <option value="classic">Classic</option>
                <option value="minimal">Minimal</option>
              </select>
            </label>
            <button type="button" onClick={printPdf} aria-label="Download prescription PDF" className="grid size-10 place-items-center rounded-full bg-ink-50 text-content-secondary transition-colors duration-ds-fast ease-ds-out hover:bg-primary-50 hover:text-primary-600">
              <Printer size={18} />
            </button>
          </div>

          <div className="relative flex min-h-[520px] flex-1 flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white">
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center" style={{ opacity: currentTemplate.watermarkOpacity }}>
              <img src={currentTemplate.logoUrl} className="w-1/2 grayscale" alt="" />
            </div>
            {/* Rx header band follows the brand (was a fixed blue): primary-50 fill + primary-500 rule. */}
            <div className="flex flex-col items-start justify-between gap-4 border-b-2 border-primary-500 bg-primary-50 p-6 md:flex-row">
              <div className="flex items-start gap-4">
                <img src={currentTemplate.logoUrl} className="size-12 shrink-0 object-contain md:size-16" alt="" />
                <div>
                  <h2 className="font-serif text-base font-bold leading-tight text-primary-600 md:text-2xl">{currentTemplate.hospitalName}</h2>
                  <p className="mt-1 max-w-[240px] text-[10px] leading-relaxed text-content-tertiary">{currentTemplate.address}</p>
                </div>
              </div>
              <div className="md:text-right">
                <p className="text-sm font-bold leading-tight text-content-primary md:text-xl">{doctor?.name}</p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-primary-600 md:text-sm">{doctor?.specialty}</p>
                <p className="mt-1 text-[9px] uppercase text-content-tertiary">{doctor?.degrees}</p>
              </div>
            </div>
            <div className="flex flex-col gap-x-8 gap-y-2 border-b border-ink-100 bg-ink-50/50 px-6 py-3 text-[11px] uppercase tracking-widest sm:flex-row sm:items-center">
              <span className="flex min-w-0 items-center gap-1"><span className="shrink-0 text-primary-600">Name:</span> <span className="truncate text-content-secondary">{patientName || '__________'}</span></span>
              <span className="flex items-center gap-1"><span className="text-primary-600">Age/Sex:</span> <span className="text-content-secondary">{age || '____'} / {gender.charAt(0)}</span></span>
              <span className="flex items-center gap-1 text-primary-600 sm:ml-auto">ID: <span className="text-content-secondary">#PRES-LIVE</span></span>
            </div>
            <div className="custom-scrollbar flex flex-1 flex-col overflow-y-auto p-6 md:flex-row">
              <div className="w-full space-y-8 border-ink-100 md:w-1/3 md:border-r md:pr-6">
                <PreviewSection title="Clinical Findings">
                  <ul className="list-disc space-y-1.5 pl-4 text-xs text-content-secondary marker:text-ink-300">
                    {complaints.filter(c => c.trim()).length > 0 ? complaints.map((c, i) => <li key={i}>{c}</li>) : <li className="italic text-ink-300">None entered</li>}
                  </ul>
                </PreviewSection>
                <PreviewSection title="Diagnosis">
                  <p className="text-xs text-content-secondary">{diagnosis || <span className="italic text-ink-300">—</span>}</p>
                </PreviewSection>
                <PreviewSection title="Tests Recommended">
                  <ol className="list-decimal space-y-1.5 pl-4 text-xs text-content-secondary marker:text-ink-300">
                    {tests.filter(t => t.trim()).length > 0 ? tests.map((t, i) => <li key={i}>{t}</li>) : <li className="italic text-ink-300">No tests requested</li>}
                  </ol>
                </PreviewSection>
                {followUpDate && (
                  <PreviewSection title="Follow Up">
                    <p className="flex items-center gap-2 text-xs text-content-secondary">
                      <Calendar size={14} className="text-primary-500" /> {new Date(followUpDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </PreviewSection>
                )}
              </div>
              <div className="relative flex flex-1 flex-col pt-8 md:pl-8 md:pt-0">
                <span aria-hidden="true" className="pointer-events-none absolute right-0 top-0 select-none text-8xl font-black italic opacity-[0.05]">Rx</span>
                <div className="min-h-[240px] flex-1 space-y-6">
                  {selectedMeds.length === 0 && <p className="mt-12 text-sm italic text-ink-300">No medicines added to Rx yet...</p>}
                  {selectedMeds.map((item, idx) => (
                    <div key={idx} className="group relative">
                      <p className="text-base text-content-primary">{idx + 1}. {item.medicine.brandName} <span className="text-xs text-content-tertiary">{item.medicine.strength}</span></p>
                      <div className="mt-2 flex items-center gap-4">
                        <span className="rounded-ds-sm border border-ink-200 bg-ink-100 px-3 py-1 text-xs tracking-widest text-content-primary">{item.morningDose} + {item.noonDose} + {item.nightDose}</span>
                        <span className="text-xs text-content-tertiary">{item.instruction} | {item.duration} Days</span>
                      </div>
                      <button onClick={() => removeMedicine(idx)} aria-label={`Remove ${item.medicine.brandName}`} className="absolute -right-2 top-0 p-1 text-ink-300 transition hover:text-[#ed7272]"><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
                <div className="mt-8 border-t border-ink-100 pt-6">
                  <h4 className="mb-2 text-[9px] uppercase tracking-[0.2em] text-primary-500">Advice:</h4>
                  <p className="text-xs italic leading-relaxed text-content-secondary">{advice}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT: step card (436) */}
        <section aria-label="Prescription details" className={`w-full flex-col justify-between gap-6 rounded-ds-lg bg-white p-5 xl:w-[436px] xl:shrink-0 ${mobileView === 'preview' ? 'hidden xl:flex' : 'flex'}`}>
          <div className="flex flex-col gap-4">
            {step === 0 && (
              <>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-ds-title-24 text-content-primary">Patient Overview</h2>
                  {initialPatient && (
                    <button onClick={onClearInitial} className="flex items-center gap-1 text-ds-small text-[#ed7272]"><X size={12} /> Clear Data</button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Name">
                    <input className={INPUT} placeholder="Enter patient name" value={patientName} onChange={e => setPatientName(e.target.value)} />
                  </Field>
                  <Field label="Age">
                    <input className={INPUT} placeholder="Enter Age" inputMode="numeric" value={age} onChange={e => setAge(e.target.value)} />
                  </Field>
                  <Field label="Gender">
                    <SelectBox value={gender} onChange={setGender} options={['Male', 'Female', 'Other']} />
                  </Field>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h2 className="text-ds-title-24 text-content-primary">Diagnosis</h2>
                <Field label="Clinical Notes">
                  <textarea className={`${INPUT} h-[138px] resize-none py-3`} placeholder="Chief complaints (one per line)..." value={complaints.join('\n')} onChange={e => setComplaints(e.target.value.split('\n'))} />
                </Field>
                <Field label="Diagnosis">
                  <textarea className={`${INPUT} h-[138px] resize-none py-3`} placeholder="Type" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} />
                </Field>
                <Field label="Next Follow Up">
                  <input type="date" className={INPUT} value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
                  <div className="flex gap-2">
                    {[7, 14, 30].map(days => (
                      <button type="button" key={days} onClick={() => handleQuickDate(days)} className={CHIP(false)}>+{days === 30 ? '1 Month' : `${days} Days`}</button>
                    ))}
                  </div>
                </Field>
                <Field label="Advice">
                  <textarea className={`${INPUT} h-20 resize-none py-3`} value={advice} onChange={e => setAdvice(e.target.value)} />
                </Field>
              </>
            )}

            {step === 2 && (
              <>
                <Field label="Recommended Tests">
                  <div className="flex flex-wrap gap-2">
                    {COMMON_TESTS.map(t => (
                      <button key={t} type="button" aria-pressed={tests.includes(t)} onClick={() => toggleTest(t)} className={CHIP(tests.includes(t))}>{t}</button>
                    ))}
                  </div>
                  <textarea className={`${INPUT} h-[46px] min-h-[46px] resize-y py-3`} placeholder="Required diagnostic tests (one per line)..." value={tests.join('\n')} onChange={e => setTests(e.target.value.split('\n'))} />
                </Field>

                <div className="relative z-20 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-ds-body text-content-primary">Add Medicines</span>
                    {!tempMed && !addingToCatalog && (
                      <span className="text-ds-small text-content-tertiary">{catalogLoading ? <Loader2 size={10} className="inline animate-spin" /> : `${catalog.length} in catalog`}</span>
                    )}
                  </div>

                  {tempMed ? (
                    /* Expanded medicine row (Figma accordion): Morning / Noon / Night, Duration, Instruction */
                    <div className="flex flex-col gap-3 rounded-2xl border border-ink-100 p-3">
                      <div className="flex items-start justify-between gap-2 px-1">
                        <div className="flex min-w-0 items-start gap-3">
                          <MaskIcon src={PILL_ICON} size={16} className="mt-1 text-primary-500" />
                          <div className="min-w-0">
                            <p className="truncate text-ds-body text-content-primary">{tempMed.medicine?.brandName}</p>
                            <p className="truncate text-ds-small text-content-secondary">{tempMed.medicine?.route}{tempMed.medicine?.strength ? ` · ${tempMed.medicine.strength}` : ''}{tempMed.medicine?.genericName ? ` · ${tempMed.medicine.genericName}` : ''}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={(e) => toggleFavorite(e, tempMed.medicine?.id || '')} aria-label="Favourite" className="rounded-full p-1.5 hover:bg-primary-50">
                            <Star size={16} className={favorites.includes(tempMed.medicine?.id || '') ? 'fill-amber-400 text-amber-400' : 'text-ink-300'} />
                          </button>
                          <button onClick={cancelAddMedicine} aria-label="Cancel" className="rounded-full p-1.5 text-content-tertiary hover:text-[#ed7272]"><X size={16} /></button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {(['Morning', 'Noon', 'Night'] as const).map((period, i) => {
                          const key = i === 0 ? 'morningDose' : i === 1 ? 'noonDose' : 'nightDose';
                          return (
                            <label key={period} className={`${OUTLINE} flex-col !items-start gap-0.5 py-1.5`}>
                              <span className="text-[10px] text-content-tertiary">{period}</span>
                              <select className="w-full bg-transparent text-ds-body text-content-primary outline-none" value={tempMed[key as keyof typeof tempMed] as string} onChange={(e) => setTempMed({ ...tempMed, [key]: e.target.value })}>
                                {DOSAGE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                            </label>
                          );
                        })}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {[['0+0+1', 'Bedtime'], ['1+0+1', 'BD'], ['1+1+1', 'TDS'], ['1+0+0', 'Morning only'], ['0+1+0', 'Noon only']].map(([pr, label]) => (
                          <button key={pr} onClick={() => applyDosagePreset(pr)} className={CHIP(false)}>{label}</button>
                        ))}
                      </div>
                      <label className={`${OUTLINE} justify-between`}>
                        <span className="text-ds-body text-content-tertiary">Duration Period</span>
                        <span className="flex items-center gap-1">
                          <input type="number" min="1" max="365" className="w-14 bg-transparent text-right text-ds-body text-content-primary outline-none" value={tempMed.duration || '7'} onChange={e => setTempMed({ ...tempMed, duration: e.target.value })} />
                          <span className="text-ds-small text-content-tertiary">days</span>
                        </span>
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {[3, 5, 7, 10, 14, 30].map(d => (
                          <button key={d} onClick={() => setTempMed({ ...tempMed, duration: String(d) })} className={CHIP(String(tempMed.duration) === String(d))}>{d}d</button>
                        ))}
                      </div>
                      <label className={`${OUTLINE} justify-between`}>
                        <span className="sr-only">Instruction</span>
                        <select className="w-full bg-transparent text-ds-body text-content-primary outline-none" value={tempMed.instruction} onChange={e => setTempMed({ ...tempMed, instruction: e.target.value })}>
                          {['After meal', 'Before meal', 'Empty stomach', 'With water'].map(instr => <option key={instr} value={instr}>{instr}</option>)}
                        </select>
                      </label>
                      <DashboardButton variant="primary" icon={<Check size={16} />} onClick={confirmAddMedicine} className="w-full pr-4">
                        <span className="px-3">Add to Prescription</span>
                      </DashboardButton>
                    </div>
                  ) : addingToCatalog ? (
                    <div className="flex flex-col gap-3 rounded-2xl border border-ink-100 p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-ds-body text-content-primary">Add to Medicine Catalog</p>
                          <p className="text-ds-small text-content-tertiary">Available to all doctors once added</p>
                        </div>
                        <button onClick={() => setAddingToCatalog(false)} aria-label="Close" className="text-content-tertiary"><X size={16} /></button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input placeholder="Brand Name *" value={newMedForm.name} onChange={e => setNewMedForm({ ...newMedForm, name: e.target.value })} className={`${INPUT} col-span-2`} />
                        <input placeholder="Generic Name" value={newMedForm.generic_name} onChange={e => setNewMedForm({ ...newMedForm, generic_name: e.target.value })} className={INPUT} />
                        <input placeholder="Strength (e.g. 500mg)" value={newMedForm.strength} onChange={e => setNewMedForm({ ...newMedForm, strength: e.target.value })} className={INPUT} />
                        <SelectBox value={newMedForm.category} onChange={v => setNewMedForm({ ...newMedForm, category: v })} options={MEDICINE_CATEGORIES} />
                        <SelectBox value={newMedForm.form} onChange={v => setNewMedForm({ ...newMedForm, form: v })} options={MEDICINE_FORMS} />
                        <input placeholder="Manufacturer (optional)" value={newMedForm.manufacturer} onChange={e => setNewMedForm({ ...newMedForm, manufacturer: e.target.value })} className={`${INPUT} col-span-2`} />
                      </div>
                      <DashboardButton variant="primary" icon={savingNewMed ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} disabled={!newMedForm.name.trim() || savingNewMed} onClick={handleAddToCatalog} className="w-full pr-4">
                        <span className="px-3">{savingNewMed ? 'Adding to catalog...' : 'Add & Use in Prescription'}</span>
                      </DashboardButton>
                    </div>
                  ) : (
                    <>
                      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
                        {catalogCategories.map(cat => (
                          <button key={cat} onClick={() => setCategoryFilter(cat)} aria-pressed={categoryFilter === cat} className={`shrink-0 ${CHIP(categoryFilter === cat)}`}>{cat}</button>
                        ))}
                      </div>
                      <div className="relative">
                        <input
                          className={`${INPUT} h-[43px] pr-10`}
                          placeholder="Search a medicine to add ..."
                          value={medSearch}
                          onChange={e => { setMedSearch(e.target.value); setShowMedResults(true); }}
                          onFocus={() => setShowMedResults(true)}
                        />
                        {medSearch ? (
                          <button onClick={() => { setMedSearch(''); setShowMedResults(false); }} aria-label="Clear search" className="absolute right-3 top-3 text-content-tertiary"><X size={18} /></button>
                        ) : (
                          <Search size={18} className="pointer-events-none absolute right-3 top-3 text-content-secondary" />
                        )}
                      </div>

                      {showMedResults && medSearch && (
                        <div className="max-h-72 overflow-y-auto rounded-2xl bg-white shadow-ds-rise-lg outline outline-1 -outline-offset-1 outline-surface">
                          {catalogLoading ? (
                            <div className="p-6 text-center"><Loader2 size={20} className="mx-auto animate-spin text-primary-500" /></div>
                          ) : filteredMedicines.length > 0 ? (
                            filteredMedicines.map(med => (
                              <button type="button" key={med.id} onClick={() => initiateAddMedicine(med)} className="flex w-full items-center gap-3 border-b border-ink-50 px-4 py-3 text-left last:border-0 hover:bg-primary-50">
                                <MaskIcon src={PILL_ICON} size={16} className="text-primary-500" />
                                <span className="min-w-0 flex-1">
                                  <span className="flex items-center gap-2 text-ds-body text-content-primary">{med.brandName}{favorites.includes(med.id) && <Star size={10} className="shrink-0 fill-amber-400 text-amber-400" />}</span>
                                  <span className="block truncate text-ds-small text-content-tertiary">{med.genericName}</span>
                                </span>
                                <span className="flex shrink-0 flex-col items-end gap-1 text-[10px]">
                                  {med.strength && <span className="rounded-md bg-ink-100 px-2 py-0.5 text-content-secondary">{med.strength}</span>}
                                  <span className="rounded-md bg-primary-50 px-2 py-0.5 text-primary-600">{med.route}</span>
                                </span>
                              </button>
                            ))
                          ) : (
                            <div className="flex flex-col gap-2 p-4">
                              <p className="text-ds-body text-content-secondary">No results for <span className="text-content-primary">"{medSearch}"</span></p>
                              <button onClick={() => { setNewMedForm(prev => ({ ...prev, name: medSearch })); setAddingToCatalog(true); setShowMedResults(false); setMedSearch(''); }} className={`${CHIP(false)} justify-center gap-2`}>
                                <Plus size={14} /> Add "{medSearch}" to medicine catalog
                              </button>
                              <button onClick={() => { setAddingToCatalog(true); setShowMedResults(false); setMedSearch(''); }} className="flex items-center justify-center gap-1 py-1 text-ds-small text-content-tertiary">
                                <Tag size={12} /> Add custom medicine with full details
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {showMedResults && !medSearch && filteredMedicines.length > 0 && (
                        <div className="overflow-hidden rounded-2xl bg-white outline outline-1 -outline-offset-1 outline-surface">
                          <p className="px-4 pb-1 pt-3 text-[10px] uppercase tracking-widest text-content-tertiary">Recent & Favourites</p>
                          {filteredMedicines.slice(0, 8).map(med => (
                            <button type="button" key={med.id} onClick={() => initiateAddMedicine(med)} className="flex w-full items-center gap-3 border-t border-ink-50 px-4 py-2.5 text-left hover:bg-primary-50">
                              <Star size={12} className={favorites.includes(med.id) ? 'fill-amber-400 text-amber-400' : 'text-ink-200'} />
                              <span className="flex-1 text-ds-body text-content-primary">{med.brandName}</span>
                              <span className="text-[10px] text-content-tertiary">{med.strength}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {!medSearch && (
                        <button onClick={() => { setAddingToCatalog(true); setShowMedResults(false); }} className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-ink-200 py-2.5 text-ds-small text-content-tertiary transition-colors duration-ds-fast ease-ds-out hover:border-primary-300 hover:text-primary-600">
                          <Plus size={14} /> Add custom / new medicine to catalog
                        </button>
                      )}
                    </>
                  )}

                  {/* Added medicines (collapsed Figma rows) */}
                  {selectedMeds.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 rounded-2xl border border-ink-100 px-4 py-3">
                      <MaskIcon src={PILL_ICON} size={16} className="text-primary-500" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-ds-body text-content-primary">{item.medicine.brandName}</span>
                        <span className="block truncate text-ds-small text-content-secondary">{item.medicine.route} | {item.morningDose}+{item.noonDose}+{item.nightDose} · {item.duration} days</span>
                      </span>
                      <button onClick={() => removeMedicine(idx)} aria-label={`Remove ${item.medicine.brandName}`} className="p-1 text-ink-300 transition hover:text-[#ed7272]"><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Step actions: Next | Back + Next | Cancel + Confirm */}
          <div className="flex items-center gap-2">
            {step > 0 && (
              <DashboardButton variant="secondary" icon={false} onClick={() => setStep((step - 1) as 0 | 1)} className="flex-1 px-4">{step === 2 ? 'Cancel' : 'Back'}</DashboardButton>
            )}
            {step < 2 ? (
              <DashboardButton variant="primary" icon={false} onClick={() => setStep((step + 1) as 1 | 2)} className={`${step > 0 ? 'flex-[1.1]' : 'w-full'} px-4`}>Next</DashboardButton>
            ) : (
              <DashboardButton variant="primary" icon={false} onClick={handleFinishPrescription} className="flex-[1.1] px-4">Confirm</DashboardButton>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

const PILL_ICON = '/assets/figma/patient-live-appts/pill-badge.svg';
const COMMON_TESTS = ['X-Ray', 'ECG', 'EEG', 'CBC', 'Blood Sugar'];
const INPUT = 'w-full rounded-2xl bg-ink-50 px-3 h-[38px] text-ds-body text-content-primary outline-none placeholder:text-content-tertiary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500';
const OUTLINE = 'flex h-[44px] items-center rounded-2xl border border-ink-100 px-3';
const CHIP = (active: boolean) => `inline-flex h-[29px] items-center rounded-full px-3 text-ds-body transition-colors duration-ds-fast ease-ds-out ${active ? 'bg-primary-500 text-white' : 'bg-primary-50 text-content-secondary hover:bg-primary-100'}`;

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex min-w-0 flex-col gap-3">
    <span className="text-ds-paragraph text-content-secondary">{label}</span>
    {children}
  </div>
);

const SelectBox: React.FC<{ value: string; onChange: (v: string) => void; options: string[] }> = ({ value, onChange, options }) => (
  <span className="relative block">
    <select value={value} onChange={e => onChange(e.target.value)} className={`${INPUT} h-[44px] appearance-none pr-9`}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
    <ChevronDown size={18} className="pointer-events-none absolute right-3 top-[13px] text-content-secondary" />
  </span>
);

const PreviewSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section>
    <h4 className="mb-3 text-[9px] uppercase tracking-[0.2em] text-primary-500">{title}</h4>
    {children}
  </section>
);

// Three-step progress (Figma "Paitient Overview / Diagnosis / Test & Medicines"): 8px track, filled up to the current step,
// the small triangle marks the step being edited. Each label jumps back to its step.
const STEPS = ['Patient Overview', 'Diagnosis', 'Test & Medicines'] as const;
const StepProgress: React.FC<{ step: 0 | 1 | 2; onStep: (s: 0 | 1 | 2) => void }> = ({ step, onStep }) => {
  // Figma fills 41% on step 1 and 92% on step 3; its step-2 frame draws 30% (less than step 1), so step 2 uses 66% to keep progress monotonic.
  const pct = step === 0 ? 41.5 : step === 1 ? 66 : 92;
  return (
    <div className="flex w-full flex-col gap-2 lg:w-[651px]" aria-label={`Step ${step + 1} of 3`}>
      <div className="flex justify-between text-ds-small text-content-secondary">
        {STEPS.map((label, i) => (
          <button key={label} type="button" onClick={() => onStep(i as 0 | 1 | 2)} aria-current={step === i ? 'step' : undefined} className={step === i ? 'text-content-primary' : ''}>{label}</button>
        ))}
      </div>
      <div className="relative h-2 rounded-full bg-primary-50">
        <div className="h-full rounded-full bg-primary-500 transition-[width] duration-ds-slow ease-ds-out" style={{ width: `${pct}%` }} />
        <MaskIcon src="/assets/figma/patient-live-appts/progress-indicator.svg" size={7} className="absolute -top-[9px] -translate-x-1/2 text-primary-500 transition-[left] duration-ds-slow ease-ds-out" style={{ left: `${pct}%` }} />
      </div>
    </div>
  );
};
