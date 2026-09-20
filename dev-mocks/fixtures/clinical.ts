/**
 * Medicine catalog + prescription templates used to generate realistic prescriptions.
 * Brand names are deliberately fictional ("Paracet 500"); generics are real.
 */
import { NS, Rows, uuid } from './util';

type MedDef = [name: string, generic: string, category: string, form: string, strength: string];

const MED_DEFS: MedDef[] = [
  ['Paracet 500', 'Paracetamol', 'Analgesic', 'Tablet', '500 mg'],
  ['Paracet Syrup', 'Paracetamol', 'Analgesic', 'Syrup', '120 mg/5 ml'],
  ['Ibuprof 400', 'Ibuprofen', 'NSAID', 'Tablet', '400 mg'],
  ['Diclo 50', 'Diclofenac Sodium', 'NSAID', 'Tablet', '50 mg'],
  ['Naprox 500', 'Naproxen', 'NSAID', 'Tablet', '500 mg'],
  ['Amoxi 500', 'Amoxicillin', 'Antibiotic', 'Capsule', '500 mg'],
  ['Azithro 500', 'Azithromycin', 'Antibiotic', 'Tablet', '500 mg'],
  ['Cefix 200', 'Cefixime', 'Antibiotic', 'Capsule', '200 mg'],
  ['Cipro 500', 'Ciprofloxacin', 'Antibiotic', 'Tablet', '500 mg'],
  ['Metro 400', 'Metronidazole', 'Antibiotic', 'Tablet', '400 mg'],
  ['Doxycyc 100', 'Doxycycline', 'Antibiotic', 'Capsule', '100 mg'],
  ['Omepra 20', 'Omeprazole', 'Antacid/PPI', 'Capsule', '20 mg'],
  ['Esomep 20', 'Esomeprazole', 'Antacid/PPI', 'Tablet', '20 mg'],
  ['Panto 40', 'Pantoprazole', 'Antacid/PPI', 'Tablet', '40 mg'],
  ['Domperid 10', 'Domperidone', 'General', 'Tablet', '10 mg'],
  ['Cetiri 10', 'Cetirizine', 'Antihistamine', 'Tablet', '10 mg'],
  ['Fexofen 120', 'Fexofenadine', 'Antihistamine', 'Tablet', '120 mg'],
  ['Loratad 10', 'Loratadine', 'Antihistamine', 'Tablet', '10 mg'],
  ['Amlodip 5', 'Amlodipine', 'Antihypertensive', 'Tablet', '5 mg'],
  ['Losart 50', 'Losartan Potassium', 'Antihypertensive', 'Tablet', '50 mg'],
  ['Atenol 50', 'Atenolol', 'Antihypertensive', 'Tablet', '50 mg'],
  ['Bisopro 5', 'Bisoprolol', 'Antihypertensive', 'Tablet', '5 mg'],
  ['Propranol 20', 'Propranolol', 'Antihypertensive', 'Tablet', '20 mg'],
  ['Metfor 500', 'Metformin', 'Antidiabetic', 'Tablet', '500 mg'],
  ['Glimep 2', 'Glimepiride', 'Antidiabetic', 'Tablet', '2 mg'],
  ['Sitaglip 50', 'Sitagliptin', 'Antidiabetic', 'Tablet', '50 mg'],
  ['Atorva 20', 'Atorvastatin', 'Statin', 'Tablet', '20 mg'],
  ['Rosuva 10', 'Rosuvastatin', 'Statin', 'Tablet', '10 mg'],
  ['Clopid 75', 'Clopidogrel', 'Antiplatelet', 'Tablet', '75 mg'],
  ['Aspir 75', 'Aspirin', 'Antiplatelet', 'Tablet', '75 mg'],
  ['Salbut Inhaler', 'Salbutamol', 'Bronchodilator', 'Inhaler', '100 mcg'],
  ['Montelu 10', 'Montelukast', 'Antiasthmatic', 'Tablet', '10 mg'],
  ['Predni 10', 'Prednisolone', 'Corticosteroid', 'Tablet', '10 mg'],
  ['Hydrocort Cream', 'Hydrocortisone', 'Corticosteroid', 'Cream', '1%'],
  ['Flucon 150', 'Fluconazole', 'Antifungal', 'Capsule', '150 mg'],
  ['Clotrim Cream', 'Clotrimazole', 'Antifungal', 'Cream', '1%'],
  ['Sertra 50', 'Sertraline', 'Antidepressant', 'Tablet', '50 mg'],
  ['Clonaz 0.5', 'Clonazepam', 'Anxiolytic', 'Tablet', '0.5 mg'],
  ['Gabapent 300', 'Gabapentin', 'General', 'Capsule', '300 mg'],
  ['Levothy 50', 'Levothyroxine', 'General', 'Tablet', '50 mcg'],
  ['Vit D3 60K', 'Cholecalciferol', 'Supplement', 'Capsule', '60000 IU'],
  ['Ferrous Plus', 'Ferrous Fumarate + Folic Acid', 'Supplement', 'Capsule', '200 mg + 0.5 mg'],
  ['Calci-D', 'Calcium + Vitamin D3', 'Supplement', 'Tablet', '500 mg'],
];

export const MEDICINES: Rows = MED_DEFS.map(([name, generic_name, category, form, strength], i) => ({
  id: uuid(NS.med, i + 1),
  name,
  generic_name,
  category,
  form,
  strength,
  manufacturer: 'Demo Pharma Ltd.',
  added_by_doctor_id: null,
  is_verified: true,
}));

export interface RxTemplate {
  dx: string;
  findings: string;
  tests: string;
  notes: string;
  /** [medicine name, "morning+noon+night", days, before|after meal] */
  meds: [string, string, number, 'before' | 'after'][];
}

const T = (dx: string, findings: string, tests: string, notes: string, meds: RxTemplate['meds']): RxTemplate => ({ dx, findings, tests, notes, meds });

export const RX_BY_SPECIALTY: Record<string, RxTemplate[]> = {
  Cardiologist: [
    T('Hypertension (Stage 1)', 'BP 148/94 mmHg\nOccasional morning headache', 'ECG\nLipid profile\nSerum creatinine', 'Reduce salt intake. Walk 30 minutes daily. Recheck BP in 2 weeks.', [['Amlodip 5', '1+0+0', 30, 'after'], ['Aspir 75', '0+1+0', 30, 'after']]),
    T('Stable angina', 'Chest tightness on exertion\nNo rest pain', 'Echocardiogram\nTreadmill test\nHbA1c', 'Avoid heavy exertion. Report any rest pain immediately.', [['Atorva 20', '0+0+1', 30, 'after'], ['Bisopro 5', '1+0+0', 30, 'after'], ['Clopid 75', '0+1+0', 30, 'after']]),
    T('Palpitations (benign)', 'Irregular pulse on exam\nECG: sinus rhythm', 'Holter monitoring\nTSH', 'Limit caffeine. Stay hydrated.', [['Propranol 20', '1+0+1', 14, 'after']]),
  ],
  Dermatologist: [
    T('Acne vulgaris', 'Inflammatory papules on cheeks and forehead', 'None', 'Wash face twice daily. Avoid picking. Use sunscreen.', [['Doxycyc 100', '0+0+1', 30, 'after'], ['Clotrim Cream', '0+0+1', 14, 'after']]),
    T('Atopic eczema', 'Dry, itchy patches on flexures', 'Total IgE', 'Moisturize twice daily. Avoid hot showers.', [['Cetiri 10', '0+0+1', 14, 'after'], ['Hydrocort Cream', '1+0+1', 10, 'after']]),
    T('Tinea corporis', 'Annular scaly plaques on trunk', 'KOH mount', 'Keep skin dry. Wash clothes in hot water.', [['Flucon 150', '1+0+0', 14, 'after'], ['Clotrim Cream', '1+0+1', 21, 'after']]),
  ],
  Dentist: [
    T('Dental caries with pulpitis', 'Deep cavity #36, sensitive to cold', 'IOPA X-ray', 'Root canal treatment advised. Avoid very hot/cold food.', [['Amoxi 500', '1+1+1', 5, 'after'], ['Ibuprof 400', '1+0+1', 5, 'after']]),
    T('Chronic gingivitis', 'Bleeding gums on probing', 'None', 'Scaling and polishing done. Brush gently twice daily.', [['Metro 400', '1+1+1', 5, 'after']]),
  ],
  Neurologist: [
    T('Migraine without aura', 'Unilateral throbbing headache, photophobia', 'MRI brain (if persistent)', 'Keep a headache diary. Regular sleep. Avoid known triggers.', [['Propranol 20', '1+0+1', 30, 'after'], ['Paracet 500', '1+1+1', 5, 'after']]),
    T('Neuropathic pain (lower limb)', 'Burning pain, reduced sensation in feet', 'Nerve conduction study\nHbA1c\nVitamin B12', 'Foot care. Review with reports in 3 weeks.', [['Gabapent 300', '0+0+1', 30, 'after'], ['Vit D3 60K', '0+0+1', 14, 'after']]),
  ],
  Orthopedics: [
    T('Mechanical low back pain', 'Paraspinal tenderness L4-L5, SLR negative', 'X-ray lumbosacral spine', 'Avoid heavy lifting. Physiotherapy twice weekly.', [['Diclo 50', '1+0+1', 7, 'after'], ['Panto 40', '1+0+0', 7, 'before'], ['Calci-D', '0+1+0', 30, 'after']]),
    T('Knee osteoarthritis', 'Crepitus on movement, mild effusion', 'X-ray knee (standing)\nESR', 'Weight reduction. Quadriceps strengthening exercises.', [['Naprox 500', '1+0+1', 10, 'after'], ['Calci-D', '0+1+0', 60, 'after']]),
  ],
  Pediatrician: [
    T('Viral fever', 'Temp 101 F, throat mildly congested', 'CBC (if fever > 3 days)', 'Plenty of fluids. Tepid sponging. Return if fever persists > 3 days.', [['Paracet Syrup', '1+1+1', 4, 'after']]),
    T('Acute bronchitis', 'Cough with wheeze, chest clear of crepitations', 'Chest X-ray (if no improvement)', 'Steam inhalation. Avoid cold drinks and dust.', [['Azithro 500', '1+0+0', 3, 'after'], ['Montelu 10', '0+0+1', 14, 'after'], ['Salbut Inhaler', '1+0+1', 7, 'after']]),
  ],
  Gynecologist: [
    T('Iron-deficiency anemia', 'Pallor, Hb 9.4 g/dL', 'CBC\nSerum ferritin', 'Iron-rich diet. Take iron away from tea/coffee.', [['Ferrous Plus', '0+1+0', 60, 'after'], ['Vit D3 60K', '0+0+1', 14, 'after']]),
    T('Polycystic ovary syndrome', 'Irregular cycles, mild hirsutism', 'Pelvic ultrasound\nHormonal profile', 'Weight management. Regular exercise.', [['Metfor 500', '1+0+1', 90, 'after']]),
  ],
  'ENT Specialist': [
    T('Acute sinusitis', 'Nasal congestion, facial pressure, post-nasal drip', 'X-ray PNS', 'Steam inhalation. Saline nasal wash.', [['Amoxi 500', '1+1+1', 7, 'after'], ['Fexofen 120', '0+0+1', 10, 'after']]),
    T('Acute tonsillitis', 'Enlarged erythematous tonsils with exudate', 'Throat swab (if recurrent)', 'Warm saline gargles. Soft diet.', [['Azithro 500', '1+0+0', 3, 'after'], ['Paracet 500', '1+1+1', 5, 'after']]),
  ],
  'Medicine Specialist': [
    T('Type 2 diabetes mellitus', 'FBS 9.1 mmol/L, BMI 27', 'HbA1c\nFasting lipid profile\nUrine ACR', 'Diet control and daily walking. Bring glucose log to next visit.', [['Metfor 500', '1+0+1', 30, 'after'], ['Glimep 2', '1+0+0', 30, 'before']]),
    T('Gastritis', 'Epigastric tenderness, no alarm features', 'H. pylori stool antigen', 'Small frequent meals. Avoid spicy food and NSAIDs.', [['Omepra 20', '1+0+1', 14, 'before'], ['Domperid 10', '1+1+1', 7, 'before']]),
    T('Viral fever', 'Temp 100.4 F, generalized myalgia', 'CBC\nDengue NS1 (if day 3+)', 'Rest and fluids. Return if fever persists beyond 3 days.', [['Paracet 500', '1+1+1', 5, 'after']]),
  ],
  Surgeon: [
    T('Post-operative wound care', 'Wound clean, no discharge', 'None', 'Keep dressing dry. Suture removal on day 10.', [['Cipro 500', '1+0+1', 5, 'after'], ['Paracet 500', '1+1+1', 5, 'after']]),
  ],
};

export const FALLBACK_RX: RxTemplate[] = RX_BY_SPECIALTY['Medicine Specialist'];
