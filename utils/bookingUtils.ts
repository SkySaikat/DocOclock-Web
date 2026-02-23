import { getDoctorClosureSettings, fetchDoctorChambers, fetchAppointments } from '../storage';
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
export const validateBooking = async ({
    doctorId,
    chamberId,
    selectedDate
}: ValidateBookingParams): Promise<ValidationResult> => {
    // 1. Check Doctor Closure
    const closure = getDoctorClosureSettings(doctorId);
    if (closure.isClosed) {
        return { success: false, reason: 'DOCTOR_OFF' };
    }

    // 2. Check Hospital Schedule
    const chambers = await fetchDoctorChambers(doctorId);
    const chamber = chambers.find(c => c.id === chamberId);

    if (!chamber) {
        return { success: false, reason: 'NO_SCHEDULE' };
    }

    const dayNumeric = getWeekdayNumber(selectedDate);
    const daySchedule = chamber.schedule.find(s => s.day === dayNumeric);

    if (!daySchedule) {
        return { success: false, reason: 'NO_SCHEDULE' };
    }

    // 3. Check Daily Booking Limit
    const existingBookings = await fetchAppointments({
        doctorId,
        hospitalId: chamberId,
        date: selectedDate
    });

    const activeBookings = existingBookings.filter(app => app.status !== 'cancelled');

    if (activeBookings.length >= daySchedule.dailyLimit) {
        return { success: false, reason: 'LIMIT_REACHED' };
    }

    return { success: true };
};
