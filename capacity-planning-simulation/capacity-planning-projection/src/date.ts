// expected date format for now is "YYYY-MM"
// FIXME: quick hack. but at least no external dependencies.
export function getMonths(start: string, end: string): string[] {
    if (start.length != 7 || end.length != 7)
        return [];
    let months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    let dates: string[] = [];
    let yearStart = parseInt(start.substr(0, 4));
    let monthStart = parseInt(start.substr(5, 2));
    let yearEnd = parseInt(end.substr(0, 4));
    let monthEnd = parseInt(end.substr(5, 2));
    if (yearStart > yearEnd)
        return [];
    if (yearStart == yearEnd && monthStart > monthEnd)
        return [];

    let date = start;
    dates.push(date);
    let monthDate = monthStart;
    let yearDate = yearStart;
    while (date !== end) {
        monthDate++;
        if (monthDate > 12) {
            monthDate = 1;
            yearDate++;
        }
        date = yearDate + '-' + months[monthDate - 1];
        dates.push(date);
    }
    return dates;
}


// FIXME: generic solution
export function monthDiff(fromDate: string, toDate: string): number {
    let diff = 0;
    if (fromDate !== toDate) {
        let months = getMonths(fromDate, toDate);
        if (months.length > 0) {
            return months.length - 1;
        }
    }
    return diff;
}