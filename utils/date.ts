export const getLocalISODate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

export const getWeekdayNumber = (dateString: string) => {
    // Use T00:00:00 to ensure local date interpretation
    const date = new Date(dateString + "T00:00:00");
    return date.getDay();
};
