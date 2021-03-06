import { Pipe, PipeTransform } from '@angular/core';
import { Utils } from '../lib/utils';

@Pipe({ name: 'formatValue' })
export class FormatValuePipe implements PipeTransform {

    transform(value: number, variableType: string) {
        return Utils.formatValue(value, variableType);
    }
}
