import { PipeTransform, Pipe } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({ name: 'highlightSubstring' })
export class HighlightSubstringPipe implements PipeTransform {

    constructor(private sanitizer: DomSanitizer) { }

    transform(fullString: string, substring: string) {
        if (!substring) {
            return fullString;
        } else {
            const regExp = new RegExp(substring, 'gi');
            const highlightHtml = '<mark style="background-color:#8c8c8c; padding:0; color:white">$&</mark>';
            return this.sanitizer.bypassSecurityTrustHtml(fullString.replace(regExp, highlightHtml));
        }
    }
}
