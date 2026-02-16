import { getDoctorClosureSettings, getDoctorPracticeSettings, getAppointments } from '../storage';
import { getWeekdayNumber } from './date';

export type ValidationResult = {
    success: boolean;
    reason?: 'DOCTOR_OFF' | 'NO_SCHEDULE' | 'LIMIT_REACHED' | 'UNKNOWN';
};

interface ValidateBookingParams {
    doctorId: string;
    chamberId: string;
    selectedDate: string;
}

/**
 * Validates if a booking can be made based on doctor closure, 
 * chamber schedule, and daily limits.
 */
export const validateBooking = ({
    doctorId,
    chamberId,
    selectedDate
}: ValidateBookingParams): ValidationResult => {
    // 1. Check Doctor Closure
    const closure = getDoctorClosureSettings(doctorId);
    if (closure.isClosed) {
        return { success: false, reason: 'DOCTOR_OFF' };
    }

    // 2. Check Hospital Schedule
    const practice = getDoctorPracticeSettings(doctorId);
    const chamber = practice.chambers.find(c => c.id === chamberId);

    if (!chamber) {
        return { success: false, reason: 'NO_SCHEDULE' };
    }

    const dayNumeric = getWeekdayNumber(selectedDate);
    const daySchedule = chamber.schedule.find(s => s.day === dayNumeric);

    if (!daySchedule) {
        return { success: false, reason: 'NO_SCHEDULE' };
    }

    // 3. Check Daily Booking Limit
    const allAppointments = getAppointments();
    const existingBookings = allAppointments.filter(app =>
        app.doctorId === doctorId &&
        app.hospitalId === chamberId &&
        app.date === selectedDate &&
        app.status !== 'cancelled'
    );

    if (existingBookings.length >= daySchedule.dailyLimit) {
        return { success: false, reason: 'LIMIT_REACHED' };
    }

    return { success: true };
};
