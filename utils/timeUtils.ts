/**
 * Utility to calculate estimated consultation time based on doctor schedule and delay.
 */
export const calculateEstimatedTime = (
    timeRange: string,
    serialNumber: number,
    delayMinutes: number | null | undefined,
    avgConsultMinutes: number = 10
): string => {
    try {
        // 1. Extract start time (e.g., "5:00 PM" from "5:00 PM - 9:00 PM")
        const startTimePart = timeRange.split('-')[0].trim();

        // 2. Parse into a Date object (using today as reference)
        const [time, modifier] = startTimePart.split(' ');
        let [hours, minutes] = time.split(':').map(Number);

        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;

        const date = new Date();
        date.setHours(hours, minutes, 0, 0);

        // 3. Apply offset: delay + (serial - 1) * average consultation time
        const safeDelay = Number(delayMinutes) || 0;
        const totalOffsetMinutes = safeDelay + (serialNumber - 1) * avgConsultMinutes;
        date.setMinutes(date.getMinutes() + totalOffsetMinutes);

        // 4. Format back to HH:MM AM/PM
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    } catch (error) {
        console.error('Error calculating estimated time:', error);
        return 'TBD';
    }
};
