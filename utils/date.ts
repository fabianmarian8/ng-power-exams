export const formatNigerianTime = (date?: Date): string => {
  if (!date) return 'N/A';
  return date.toLocaleString('en-GB', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export const formatNigerianTimeParts = (date?: Date): { date: string; time: string } => {
    if (!date) return { date: 'N/A', time: 'N/A' };
    const options: Intl.DateTimeFormatOptions = { timeZone: 'Africa/Lagos' };
    const dateStr = date.toLocaleDateString('en-GB', { ...options, weekday: 'short', month: 'short', day: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-US', { ...options, hour: 'numeric', minute: 'numeric', hour12: true });
    return { date: dateStr, time: timeStr };
}
