export interface PrescriptionData {
  doctorName: string;
  doctorDegrees: string;
  doctorSpecialty: string;
  doctorBmdc: string;
  doctorPhone?: string;
  hospitalName?: string;
  hospitalAddress?: string;
  patientName: string;
  patientAge: string;
  patientGender: string;
  date: string;
  diagnosis?: string;
  medicines: {
    name: string;
    dosage: string;
    duration: string;
    instructions?: string;
  }[];
  advice?: string;
  followUpDate?: string;
}

export type PrescriptionTemplate = 'classic' | 'modern' | 'minimal';
