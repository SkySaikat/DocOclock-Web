
import { PracticeChamber } from '../storage';

/**
 * Converts "HH:mm" (24h) or "hh:mm AM/PM" to minutes from midnight
 */
export const timeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;

    // Handle AM/PM
    if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) {
        const [time, modifier] = timeStr.trim().split(' ');
        let [hours, minutes] = time.split(':').map(Number);

        if (modifier?.toUpperCase() === 'PM' && hours < 12) hours += 12;
        if (modifier?.toUpperCase() === 'AM' && hours === 12) hours = 0;

        return hours * 60 + (minutes || 0);
    }

    // Handle 24h
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + (minutes || 0);
};

export const getActiveChamber = (chambers: PracticeChamber[]): string | null => {
    if (!chambers || chambers.length === 0) return null;
    if (chambers.length === 1) return chambers[0].id;

    const now = new Date();
    const currentDay = now.getDay();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // 1. Filter chambers active today
    const scheduledToday = chambers.filter(c =>
        c.schedule && c.schedule.some(s => s.day === currentDay)
    );

    if (scheduledToday.length === 0) return chambers[0].id; // Fallback to first if none today
    if (scheduledToday.length === 1) return scheduledToday[0].id;

    // 2. Find one where "now" is within schedule
    const currentlyActive = scheduledToday.find(c => {
        const todaySchedule = c.schedule.find(s => s.day === currentDay);
        if (!todaySchedule) return false;

        const start = timeToMinutes(todaySchedule.startTime);
        const end = timeToMinutes(todaySchedule.endTime);

        return currentMinutes >= start && currentMinutes <= end;
    });

    if (currentlyActive) return currentlyActive.id;

    // 3. Fallback: Find the one that starts next, or the one that ended most recently
    // For simplicity, pick the one with the startTime closest to now
    let closestId = scheduledToday[0].id;
    let minDiff = Infinity;

    scheduledToday.forEach(c => {
        const todaySchedule = c.schedule.find(s => s.day === currentDay);
        if (todaySchedule) {
            const start = timeToMinutes(todaySchedule.startTime);
            const diff = Math.abs(currentMinutes - start);
            if (diff < minDiff) {
                minDiff = diff;
                closestId = c.id;
            }
        }
    });

    return closestId;
};
