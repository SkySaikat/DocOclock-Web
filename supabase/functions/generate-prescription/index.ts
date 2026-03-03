// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1"

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { prescriptionId } = await req.json()

        if (!prescriptionId) {
            return new Response(JSON.stringify({ error: 'prescriptionId is required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // 1. Fetch prescription data (RLS will ensure the user has access)
        const { data: prescription, error: prescriptionError } = await supabaseClient
            .from('prescriptions')
            .select(`
        *,
        doctor:profiles!prescriptions_doctor_id_fkey(full_name, specialties, experience_years),
        patient:profiles!prescriptions_patient_profile_id_fkey(full_name, phone_number)
      `)
            .eq('id', prescriptionId)
            .single()

        if (prescriptionError || !prescription) {
            console.error('Error fetching prescription:', prescriptionError)
            return new Response(JSON.stringify({ error: 'Prescription not found or unauthorized' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Fetch chamber data if applicable
        let hospitalName = 'DocOclock Telemedicine'
        if (prescription.appointment_id) {
            const { data: appointment } = await supabaseClient
                .from('appointments')
                .select('hospital_id')
                .eq('id', prescription.appointment_id)
                .single()

            if (appointment?.hospital_id) {
                const { data: chamber } = await supabaseClient
                    .from('chambers')
                    .select('hospital_name')
                    .eq('id', appointment.hospital_id)
                    .single()
                if (chamber?.hospital_name) {
                    hospitalName = chamber.hospital_name
                }
            }
        }


        // 2. Generate PDF
        const pdfDoc = await PDFDocument.create()
        const page = pdfDoc.addPage([595.28, 841.89]) // A4 size
        const { width, height } = page.getSize()

        const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

        const margin = 50
        let yPosition = height - margin

        // --- HEADER ---
        page.drawText('DocOclock Prescription', { x: margin, y: yPosition, size: 24, font: boldFont, color: rgb(0, 0.33, 0.71) })
        yPosition -= 30

        const doctorName = prescription.doctor?.full_name || 'Doctor'
        const specialties = Array.isArray(prescription.doctor?.specialties) ? prescription.doctor.specialties.join(', ') : ''

        page.drawText(doctorName, { x: margin, y: yPosition, size: 14, font: boldFont })
        page.drawText(hospitalName, { x: width - margin - 150, y: yPosition, size: 12, font: font, color: rgb(0.3, 0.3, 0.3) })
        yPosition -= 15
        if (specialties) {
            page.drawText(specialties, { x: margin, y: yPosition, size: 10, font: font, color: rgb(0.4, 0.4, 0.4) })
        }
        yPosition -= 15
        page.drawText(`Date: ${new Date(prescription.created_at).toLocaleDateString()}`, { x: width - margin - 150, y: yPosition, size: 10, font: font })

        yPosition -= 20
        page.drawLine({ start: { x: margin, y: yPosition }, end: { x: width - margin, y: yPosition }, thickness: 1, color: rgb(0.8, 0.8, 0.8) })
        yPosition -= 20

        // --- PATIENT INFO ---
        const patientName = prescription.patient?.full_name || prescription.patient_name || 'Patient'
        page.drawText(`Patient: ${patientName}`, { x: margin, y: yPosition, size: 12, font: boldFont })

        let patientDetails = []
        if (prescription.patient_age) patientDetails.push(`Age: ${prescription.patient_age}`)
        if (prescription.patient_gender) patientDetails.push(`Gender: ${prescription.patient_gender}`)

        if (patientDetails.length > 0) {
            page.drawText(patientDetails.join(' | '), { x: margin + 200, y: yPosition, size: 11, font: font })
        }
        yPosition -= 30

        // --- BODY: LEFT COLUMN (Clinical) / RIGHT COLUMN (Rx) ---
        const leftMargin = margin
        const rightMargin = margin + 180

        // Left Column: Vitals, Findings, Diagnosis
        let leftY = yPosition

        if (prescription.diagnosis && prescription.diagnosis.length > 0) {
            page.drawText('Diagnosis', { x: leftMargin, y: leftY, size: 12, font: boldFont })
            leftY -= 15
            prescription.diagnosis.forEach((d: string) => {
                page.drawText(`• ${d}`, { x: leftMargin + 10, y: leftY, size: 10, font: font })
                leftY -= 15
            })
            leftY -= 10
        }

        if (prescription.clinical_findings && prescription.clinical_findings.length > 0) {
            page.drawText('Clinical Findings', { x: leftMargin, y: leftY, size: 12, font: boldFont })
            leftY -= 15
            prescription.clinical_findings.forEach((f: string) => {
                page.drawText(`• ${f}`, { x: leftMargin + 10, y: leftY, size: 10, font: font })
                leftY -= 15
            })
            leftY -= 10
        }

        if (prescription.tests_recommended && prescription.tests_recommended.length > 0) {
            page.drawText('Recommended Tests', { x: leftMargin, y: leftY, size: 12, font: boldFont })
            leftY -= 15
            prescription.tests_recommended.forEach((t: string) => {
                page.drawText(`• ${t}`, { x: leftMargin + 10, y: leftY, size: 10, font: font })
                leftY -= 15
            })
            leftY -= 10
        }

        // Right Column: Rx
        let rightY = yPosition
        page.drawText('Rx', { x: rightMargin, y: rightY, size: 16, font: boldFont })
        rightY -= 25

        if (prescription.medicines && prescription.medicines.length > 0) {
            prescription.medicines.forEach((med: any, index: number) => {
                // Medicine Name
                page.drawText(`${index + 1}. ${med.name}`, { x: rightMargin, y: rightY, size: 11, font: boldFont })
                rightY -= 15

                // Dosage and Schedule
                let medDetails = []
                if (med.dosage) medDetails.push(med.dosage)
                if (med.duration) medDetails.push(`for ${med.duration}`)

                if (medDetails.length > 0) {
                    page.drawText(medDetails.join(' '), { x: rightMargin + 15, y: rightY, size: 10, font: font })
                    rightY -= 13
                }

                // Instruction
                if (med.instructions || med.instruction) {
                    const instruction = med.instructions || med.instruction
                    page.drawText(`(${instruction})`, { x: rightMargin + 15, y: rightY, size: 9, font: font, color: rgb(0.3, 0.3, 0.3) })
                    rightY -= 20
                } else {
                    rightY -= 7
                }
            })
        } else {
            page.drawText('No medicines prescribed.', { x: rightMargin, y: rightY, size: 10, font: font })
            rightY -= 20
        }

        // Advice
        if (prescription.advice && prescription.advice.length > 0) {
            rightY -= 10
            page.drawText('Advice', { x: rightMargin, y: rightY, size: 12, font: boldFont })
            rightY -= 15
            prescription.advice.forEach((ad: string) => {
                page.drawText(`• ${ad}`, { x: rightMargin + 10, y: rightY, size: 10, font: font })
                rightY -= 15
            })
        }

        // Follow up
        let bottomY = Math.min(leftY, rightY) - 30
        if (prescription.follow_up_date) {
            page.drawText(`Follow-up: ${new Date(prescription.follow_up_date).toLocaleDateString()}`, { x: rightMargin, y: bottomY, size: 10, font: boldFont })
        }

        // --- FOOTER ---
        page.drawLine({ start: { x: margin, y: 50 }, end: { x: width - margin, y: 50 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) })
        page.drawText('dococlock.com - Your Digital Healthcare Partner', { x: margin, y: 35, size: 8, font: font, color: rgb(0.5, 0.5, 0.5) })
        page.drawText('This is a digitally generated prescription.', { x: width - margin - 150, y: 35, size: 8, font: font, color: rgb(0.5, 0.5, 0.5) })

        // Serialize
        const pdfBytes = await pdfDoc.save()

        // 3. Return the response as a file stream
        return new Response(pdfBytes, {
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="prescription_${prescriptionId}.pdf"`,
            },
        })
    } catch (error) {
        console.error('Error generating PDF:', error)
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
