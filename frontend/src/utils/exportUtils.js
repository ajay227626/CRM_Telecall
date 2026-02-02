/**
 * Exports an array of objects to a CSV file.
 * @param {Array} data - The data to export.
 * @param {string} filename - The name of the downloaded file (without extension).
 */
export const exportToCSV = (data, filename = 'export') => {
    if (!data || !data.length) {
        console.warn('No data to export');
        return;
    }

    // Get headers from the first object
    const headers = Object.keys(data[0]);

    // Create CSV content
    const csvContent = [
        headers.join(','), // Header row
        ...data.map(row => headers.map(fieldName => {
            const value = row[fieldName];
            // Handle commas, quotes, and newlines in data
            const stringValue = value === null || value === undefined ? '' : String(value);
            return `"${stringValue.replace(/"/g, '""')}"`;
        }).join(','))
    ].join('\n');

    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
