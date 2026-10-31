import type { LucideIcon } from 'lucide-react';
import {
   Activity, Baby, Bone, Brain, CircleDot, CloudRain, Droplet, Droplets, Ear, Eye, Flame, Flower2,
   Gauge, HeartHandshake, HeartPulse, Scale, Scissors, Sparkles, Thermometer, Utensils, Wind,
} from 'lucide-react';

export interface Department {
   id: number;
   name: string;
   desc: string;
   /** Lower-case word-start fragments matched against a doctor's `specialty` string. */
   match: string[];
}

// Order = the order shown to patients; the first ten are the "popular" row on the home page.
export const DEPARTMENTS: Department[] = [
   { id: 1, name: 'General Physician', desc: 'Primary Care Physician', match: ['general physician', 'general practitioner', 'general medicine'] },
   { id: 2, name: 'Pediatrics', desc: 'Child Health Care', match: ['pediatric', 'paediatric', 'child'] },
   { id: 3, name: 'Gynae & Obs', desc: "Women's Health Care", match: ['gyn', 'obstet', 'obs'] },
   { id: 30, name: 'Dermatology', desc: 'Skin, Hair & Sexual Health', match: ['dermat', 'skin'] },
   { id: 38, name: 'Internal Medicine', desc: 'General Health & Medicine', match: ['internal medicine', 'medicine specialist'] },
   { id: 11, name: 'Endocrinology', desc: 'Diabetes, Thyroid & Hormone', match: ['endocrin', 'diabet', 'thyroid'] },
   { id: 4, name: 'Neurology', desc: 'Brain, Spine & Nerve', match: ['neurolog'] },
   { id: 6, name: 'Gastroenterology', desc: 'Stomach, Liver & Gut', match: ['gastro', 'hepat'] },
   { id: 7, name: 'Cardiology', desc: 'Heart Disease & Vascular Disease', match: ['cardio', 'heart'] },
   { id: 23, name: 'Urology', desc: 'Urinary Bladder & Urinary Care', match: ['urolog'] },
   { id: 46, name: 'Food & Nutrition', desc: 'Healthy Diet & Nutrition Guidance', match: ['nutrition', 'dietit', 'diet'] },
   { id: 9, name: 'Dentistry', desc: 'Teeth, Gum & Oral Wellness', match: ['dent'] },
   { id: 21, name: 'Psychiatry', desc: 'Mental, Emotional & Behavioral Disorders', match: ['psychiat'] },
   { id: 52, name: 'Psychology', desc: 'Counseling & Mental Wellness', match: ['psycholog', 'counsel'] },
   { id: 41, name: 'Orthopedics', desc: 'Bone, Muscle & Joint Care', match: ['ortho'] },
   { id: 5, name: 'Pulmonology', desc: 'Lung & Respiratory Care', match: ['pulmon', 'chest', 'respirat'] },
   { id: 22, name: 'Rheumatology', desc: 'Arthritis & Pain Care', match: ['rheumat'] },
   { id: 13, name: 'Nephrology', desc: 'Kidney Disease & Treatment', match: ['nephrolog', 'kidney'] },
   { id: 8, name: 'Ophthalmology', desc: 'Vision & Eye Care', match: ['ophthal', 'eye'] },
   { id: 16, name: 'ENT', desc: 'Ear, Nose & Throat Problem', match: ['ent', 'otolaryn'] },
   { id: 43, name: 'General Surgery', desc: 'Operation & Wound Care', match: ['general surg', 'surgeon'] },
   { id: 35, name: 'Oncology', desc: 'Cancer Diagnosis & Treatment', match: ['oncolog', 'cancer'] },
   { id: 63, name: 'Breast Surgery', desc: 'Breast Care & Surgery', match: ['breast'] },
   { id: 44, name: 'Hematology', desc: 'Blood Disease', match: ['hematolog', 'haematolog'] },
   { id: 64, name: 'Pediatric Hematology & Oncology', desc: 'Children’s Blood Disorders & Cancer', match: ['pediatric hematolog', 'pediatric oncolog'] },
   { id: 39, name: 'Plastic Surgery', desc: 'Cosmetic & Reconstructive Care', match: ['plastic', 'cosmetic'] },
   { id: 55, name: 'Family Medicine', desc: 'Primary Care', match: ['family'] },
   { id: 37, name: 'Neurosurgery', desc: 'Surgery for Brain & Nerves', match: ['neurosurg'] },
   { id: 59, name: 'Public Health', desc: 'Wellness & Preventive Care', match: ['public health', 'preventive'] },
   { id: 33, name: 'Speech Therapy', desc: 'Voice, Speech & Language', match: ['speech'] },
   { id: 42, name: 'Colorectal Surgery', desc: 'Bowel & Rectal Care', match: ['colorectal', 'proctolog'] },
   { id: 47, name: 'Physical Medicine & Rehabilitation', desc: 'Movement & Physical Care', match: ['physical medicine', 'rehab', 'physiother'] },
   { id: 54, name: 'Neonatology', desc: 'Neonatal Health & Care', match: ['neonat'] },
   { id: 51, name: 'Pediatric Gastroenterology', desc: 'Child Gastro & Liver Care', match: ['pediatric gastro'] },
   { id: 49, name: 'Pediatric Neurology', desc: 'Child Brain & Nerve', match: ['pediatric neuro'] },
   { id: 48, name: 'Nuclear Medicine', desc: 'Radioactive Medicine & Scan', match: ['nuclear'] },
   { id: 36, name: 'Vascular Surgery', desc: 'Blood Vessel Health & Surgery', match: ['vascular'] },
   { id: 31, name: 'Herbal Medicine', desc: 'Natural & Plant-Based Remedies', match: ['herbal'] },
   { id: 58, name: 'Complementary & Alternative Medicine', desc: 'Complementary & Alternative Care', match: ['alternative', 'complementary'] },
   { id: 66, name: 'Life Coach & Relationship Advice', desc: 'Coaching & Relationships', match: ['life coach'] },
   { id: 67, name: 'Gynaecological Oncology', desc: 'Female Reproductive Cancer Care', match: ['gynaecological onc', 'gynecologic onc'] },
];

export interface Symptom {
   id: number;
   label: string;
   icon: LucideIcon;
   /** Departments that treat this symptom (Department ids). */
   departments: number[];
}

export const SYMPTOMS: Symptom[] = [
   { id: 1, label: 'Headache or Migraine', icon: Brain, departments: [4, 1] },
   { id: 12, label: 'Fever, Cold/Flu, Allergy', icon: Thermometer, departments: [1, 38, 16] },
   { id: 17, label: 'Chest pain/Heart problems', icon: HeartPulse, departments: [7] },
   { id: 22, label: 'Breathlessness/Cough/Asthma', icon: Wind, departments: [5, 38] },
   { id: 5, label: 'Blood pressure', icon: Gauge, departments: [7, 38] },
   { id: 9, label: 'Uncontrolled Diabetes', icon: Droplet, departments: [11, 38] },
   { id: 14, label: 'Acidity, Indigestion, Diarrhea, Constipation', icon: Flame, departments: [6] },
   { id: 8, label: 'Abdominal pain/Body pain', icon: Activity, departments: [6, 38, 1] },
   { id: 6, label: 'Joint/Muscle pain, Arthritis', icon: Bone, departments: [41, 22] },
   { id: 10, label: 'Itching, Acne & Skin problems', icon: Sparkles, departments: [30] },
   { id: 7, label: 'Hair fall and Dandruff', icon: Scissors, departments: [30] },
   { id: 18, label: 'Urine infection or problems', icon: Droplets, departments: [23, 13] },
   { id: 19, label: 'Kidney problems', icon: Droplets, departments: [13, 23] },
   { id: 20, label: 'Ear, Nose and Throat diseases', icon: Ear, departments: [16] },
   { id: 15, label: 'Eye problems', icon: Eye, departments: [8] },
   { id: 11, label: 'Stress or Depression', icon: CloudRain, departments: [21, 52] },
   { id: 16, label: 'Anorexia', icon: Utensils, departments: [46, 21, 1] },
   { id: 13, label: 'Weight lose/gain, Diet chart', icon: Scale, departments: [46, 11] },
   { id: 4, label: 'Child diseases', icon: Baby, departments: [2] },
   { id: 3, label: 'Pregnancy issues', icon: Flower2, departments: [3] },
   { id: 21, label: 'Period problems/Gyne problems', icon: Droplet, departments: [3] },
   { id: 2, label: 'Sexual problems', icon: HeartHandshake, departments: [30, 23, 3] },
   { id: 23, label: 'Piles/Anal fissure', icon: CircleDot, departments: [42, 43, 6] },
];

/** Departments shown in the compact "popular" row on the home page. */
export const POPULAR_DEPARTMENT_COUNT = 10;

export const departmentIcon = (id: number) => `/assets/departments/${id}.png`;

const startsWord = (haystack: string, fragment: string) => new RegExp(`(^|[^a-z])${fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(haystack);

/** Does a doctor's free-text specialty belong to this department? */
export const specialtyInDepartment = (specialty: string | undefined, dept: Department): boolean => {
   const s = (specialty || '').toLowerCase();
   return !!s && dept.match.some((fragment) => startsWord(s, fragment));
};

export type DoctorFilter = { kind: 'department' | 'symptom'; id: number };

export const getFilterLabel = (f: DoctorFilter): string =>
   (f.kind === 'department' ? DEPARTMENTS.find((d) => d.id === f.id)?.name : SYMPTOMS.find((s) => s.id === f.id)?.label) ?? '';

export const specialtyMatchesFilter = (specialty: string | undefined, f: DoctorFilter): boolean => {
   if (f.kind === 'department') {
      const dept = DEPARTMENTS.find((d) => d.id === f.id);
      return !!dept && specialtyInDepartment(specialty, dept);
   }
   const symptom = SYMPTOMS.find((s) => s.id === f.id);
   if (!symptom) return false;
   return symptom.departments.some((deptId) => {
      const dept = DEPARTMENTS.find((d) => d.id === deptId);
      return !!dept && specialtyInDepartment(specialty, dept);
   });
};

// The router passes a single `category` string to /patient/doctors; department / symptom picks travel as "dept:7" / "symptom:1".
export const encodeFilter = (f: DoctorFilter): string => `${f.kind === 'department' ? 'dept' : 'symptom'}:${f.id}`;

export const decodeFilter = (category: string | undefined): DoctorFilter | null => {
   const m = /^(dept|symptom):(\d+)$/.exec(category || '');
   if (!m) return null;
   const f: DoctorFilter = { kind: m[1] === 'dept' ? 'department' : 'symptom', id: Number(m[2]) };
   return getFilterLabel(f) ? f : null;
};
