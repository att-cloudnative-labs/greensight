import { Component, Input, HostBinding } from '@angular/core';

@Component({
    selector: 'app-gm-port',
    templateUrl: './gm-port.component.html',
    styleUrls: ['./gm-port.component.css']
})
export class GmPortComponent {
    @Input() port;
    @Input() disabled = false;

    // used for determining port label positioning
    @HostBinding('class') @Input() direction: string;

    constructor() { }
}
