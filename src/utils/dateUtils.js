// Helper to get current app locale
const getLocale = () => document.documentElement.lang || 'en-US';

export const formatTimeAgo = (dateBytes) => {
    const date = new Date(dateBytes);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    // Use Intl.RelativeTimeFormat if available for better localization
    if (typeof Intl !== 'undefined' && Intl.RelativeTimeFormat) {
        const rtf = new Intl.RelativeTimeFormat(getLocale(), { numeric: 'auto' });
        
        if (Math.abs(seconds) < 60) return rtf.format(-Math.floor(seconds), 'second');
        
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return rtf.format(-minutes, 'minute');
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return rtf.format(-hours, 'hour');
        
        const days = Math.floor(hours / 24);
        if (days < 30) return rtf.format(-days, 'day');
        
        const months = Math.floor(days / 30);
        if (months < 12) return rtf.format(-months, 'month');
        
        const years = Math.floor(days / 365);
        return rtf.format(-years, 'year');
    }

    // Fallback English logic
    let interval = Math.floor(seconds / 31536000);
    if (interval > 1) return interval + " years ago";

    interval = Math.floor(seconds / 2592000);
    if (interval > 1) return interval + " months ago";

    interval = Math.floor(seconds / 86400);
    if (interval > 1) return interval + " days ago";
    if (interval === 1) return "1 day ago";

    interval = Math.floor(seconds / 3600);
    if (interval > 1) return interval + " hours ago";
    if (interval === 1) return "1 hour ago";

    interval = Math.floor(seconds / 60);
    if (interval > 1) return interval + " mins ago";
    if (interval === 1) return "1 min ago";

    return "just now";
};

export const formatChartDate = (dateString, viewType) => {
    if (!dateString) return '';
    try {
        const locale = getLocale();
        if (viewType === 'daily') {
            const date = new Date(dateString);
            return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
        } else if (viewType === 'weekly') {
            if (dateString.includes('W')) {
                return `Week ${dateString.split('W')[1]}`;
            }
            return dateString;
        } else if (viewType === 'monthly') {
            const date = new Date(dateString + '-01'); 
            if (dateString.length === 7) {
                const [year, month] = dateString.split('-');
                const d = new Date(parseInt(year), parseInt(month) - 1);
                return d.toLocaleDateString(locale, { month: 'short', year: '2-digit' });
            }
            return dateString;
        } else if (viewType === 'yearly') {
            return dateString;
        } else {
            const date = new Date(dateString);
            if (!isNaN(date.getTime())) {
                return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
            }
        }
    } catch (e) {
        console.error("Date formatting error", e);
        return dateString;
    }
    return dateString;
};
