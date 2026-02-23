-- DOC OCLOCK - DEMO SEED DATA
-- Run this in your Supabase SQL Editor to see doctors on the landing page

-- 1. Insert Demo Doctors into Profiles
INSERT INTO public.profiles (
    id, full_name, role, specialty, degrees, age, gender, experience_years, total_patients, rating, about, image_url, password
) VALUES 
(
    'efcafe7e-aa11-4822-a123-4b1aec2ad2ff', 
    'Dr. Sarah Rahman', 
    'doctor', 
    'Cardiologist', 
    'MBBS, FCPS (Cardiology)', 
    42, 
    'Female', 
    15, 
    3200, 
    4.9, 
    'Specialist in Interventional Cardiology with over 15 years of experience.', 
    'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=200&h=200',
    '$2a$10$76tB9G/NEXG7y8O8uY8Ue.9k.88k8k8k8k8k8k8k8k8k8k8k8k8k8' -- Dummy hash for '123456'
),
(
    'bc2d3e4f-5678-90ab-cdef-123456789012', 
    'Dr. Ariful Islam', 
    'doctor', 
    'Neurologist', 
    'MBBS, MD (Neurology)', 
    38, 
    'Male', 
    10, 
    2100, 
    4.8, 
    'Expert in treating complex neurological disorders and brain injuries.', 
    'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200&h=200',
    '$2a$10$76tB9G/NEXG7y8O8uY8Ue.9k.88k8k8k8k8k8k8k8k8k8k8k8k8k8'
),
(
    'de3f4g5h-6789-01bc-defg-234567890123', 
    'Dr. Nusrat Jahan', 
    'doctor', 
    'Pediatrician', 
    'MBBS, DCH', 
    35, 
    'Female', 
    8, 
    1500, 
    4.7, 
    'Dedicated to providing the best healthcare for children and infants.', 
    'https://images.unsplash.com/photo-1559839734-2b71f1536783?auto=format&fit=crop&q=80&w=200&h=200',
    '$2a$10$76tB9G/NEXG7y8O8uY8Ue.9k.88k8k8k8k8k8k8k8k8k8k8k8k8k8'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Demo Chambers
INSERT INTO public.chambers (id, doctor_id, hospital_name, address, consultation_fee) VALUES
('c1cafe7e-aa11-4822-a123-4b1aec2ad2ff', 'efcafe7e-aa11-4822-a123-4b1aec2ad2ff', 'Evercare Hospital', 'Plot 81, Block E, Bashundhara R/A, Dhaka', 1000),
('c2cafe7e-aa11-4822-a123-4b1aec2ad2ff', 'bc2d3e4f-5678-90ab-cdef-123456789012', 'Square Hospital', '18/F, West Panthapath, Dhaka', 1200),
('c3cafe7e-aa11-4822-a123-4b1aec2ad2ff', 'de3f4g5h-6789-01bc-defg-234567890123', 'United Hospital', 'Plot 15, Road 71, Gulshan, Dhaka', 800)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Demo Schedules
INSERT INTO public.schedules (chamber_id, day_of_week, start_time, end_time, max_patients) VALUES
('c1cafe7e-aa11-4822-a123-4b1aec2ad2ff', 'Sunday', '17:00', '21:00', 30),
('c1cafe7e-aa11-4822-a123-4b1aec2ad2ff', 'Monday', '17:00', '21:00', 30),
('c1cafe7e-aa11-4822-a123-4b1aec2ad2ff', 'Tuesday', '17:00', '21:00', 30),
('c1cafe7e-aa11-4822-a123-4b1aec2ad2ff', 'Wednesday', '17:00', '21:00', 30),
('c1cafe7e-aa11-4822-a123-4b1aec2ad2ff', 'Thursday', '17:00', '21:00', 30),

('c2cafe7e-aa11-4822-a123-4b1aec2ad2ff', 'Saturday', '10:00', '14:00', 20),
('c2cafe7e-aa11-4822-a123-4b1aec2ad2ff', 'Monday', '10:00', '14:00', 20),

('c3cafe7e-aa11-4822-a123-4b1aec2ad2ff', 'Sunday', '18:00', '21:00', 25),
('c3cafe7e-aa11-4822-a123-4b1aec2ad2ff', 'Tuesday', '18:00', '21:00', 25);
