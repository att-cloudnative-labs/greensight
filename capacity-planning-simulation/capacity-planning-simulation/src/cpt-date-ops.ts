

export function getMonthNr(date: string): number {
    let year = parseInt(date.slice(0, 4));
    let month = parseInt(date.slice(5));
    return year * 12 + (month - 1);
}

export function monthNrToString(m: number): string {
    let year = Math.floor(m / 12);
    let month = (m % 12) + 1;
    let monthString = month < 10 ? '0' + month.toString() : month.toString();
    return year + "-" + monthString;
}

// YYYY-DD
export function genMonths(start: string, end: string): string[] {
    let s = getMonthNr(start);
    let e = getMonthNr(end);
    let monthNr: number[] = [];
    while (s <= e) {
        monthNr.push(s);
        s++;
    }
    return monthNr.map(n => monthNrToString(n));
}
