import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'formatValueWithUnit' })
export class FormatValueWithUnitPipe implements PipeTransform {
    unitFunctionMap = {
        tps: function(value) { return FormatValueWithUnitPipe.formatTps(value); },
        tpm: function(value) { return FormatValueWithUnitPipe.formatTpm(value); },
        USD: function(value) { return FormatValueWithUnitPipe.formatDollar(value); },
        percentage: function(value) { return FormatValueWithUnitPipe.formatPercentage(value); },
        Y: function(value) { return FormatValueWithUnitPipe.formatDateUnit(value, 'Y'); },
        M: function(value) { return FormatValueWithUnitPipe.formatDateUnit(value, 'M'); },
        d: function(value) { return FormatValueWithUnitPipe.formatDateUnit(value, 'd'); },
        h: function(value) { return FormatValueWithUnitPipe.formatDateUnit(value, 'h'); },
        m: function(value) { return FormatValueWithUnitPipe.formatDateUnit(value, 'm'); },
        s: function(value) { return FormatValueWithUnitPipe.formatDateUnit(value, 's'); },
        undefined: function(value) { return FormatValueWithUnitPipe.formatUndefined(value); },
        null: function(value) { return FormatValueWithUnitPipe.formatUndefined(value); }
    };

    static formatTps(value: number) {
        return value.toFixed(2) + ' tps';
    }

    static formatTpm(value: number) {
        return value.toFixed(2) + ' tpm';
    }

    static formatDollar(value: number) {
        return '$' + value.toFixed(2);
    }

    static formatPercentage(value: number) {
        return value.toFixed(2) + '%';
    }

    static formatUndefined(value) {
        if (!isNaN(value)) {
            return value.toFixed(2);
        }
    }

    static formatDateUnit(value: number, unit: string) {
        return value + ' ' + unit;
    }

    transform(value: number, unit: string) {
        if (this.unitFunctionMap[unit]) {
            return this.unitFunctionMap[unit](value);
        }
        if (!isNaN(value)) {
            return value.toFixed(2) + ' ' + unit;
        }
        return value + ' ' + unit;
    }
}
