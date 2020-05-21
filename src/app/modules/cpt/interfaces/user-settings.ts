export interface UserSettings {
    VARIABLE_DECIMAL?: number;
    BREAKDOWN_DECIMAL?: number;
    SIGMA?: number[];
    TIMEZONE?: string;
}


export function parseSigmaString(sigmaTxt: string): number[] {
    const sigmas: number[] = [];
    if (sigmaTxt && sigmaTxt.trim().length) {
        const parts = sigmaTxt.split(',');
        for (const p of parts) {
            const num = parseInt(p, 10);
            if (num !== NaN && num > 0 && num <= 100 && sigmas.findIndex(s => s === num) < 0) {
                sigmas.push(num);
            }
        }
    }
    sigmas.sort((a, b) => a - b);
    return sigmas;
}

export function stringifySigma(sigmas: number[]): string {
    return sigmas ? sigmas.join(', ') : '';
}
