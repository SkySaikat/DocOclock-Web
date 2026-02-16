export const compareTimeStrings = (time1: string, time2: string): number => {
    const toMinutes = (timeStr: string): number => {
        try {
            const [time, modifier] = timeStr.trim().split(' ');
            let [hours, minutes] = time.split(':').map(Number);

            if (modifier === 'PM' && hours < 12) hours += 12;
            if (modifier === 'AM' && hours === 12) hours = 0;

            return hours * 60 + (minutes || 0);
        } catch (e) {
            return 0;
        }
    };
    return toMinutes(time1) - toMinutes(time2);
};
