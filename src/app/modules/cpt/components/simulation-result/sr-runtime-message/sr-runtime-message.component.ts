import { Component, OnInit, Input } from '@angular/core';
import { SimulationRuntimeMessage } from '@cpt/capacity-planning-simulation-types/lib';

@Component({
    selector: 'app-sr-runtime-message',
    templateUrl: './sr-runtime-message.component.html',
    styleUrls: ['./sr-runtime-message.component.css']
})
export class SrRuntimeMessageComponent implements OnInit {
    @Input() message: SimulationRuntimeMessage;
    @Input() isError = false;

    stack: string;
    messageClass = 'warning';
    text: string;
    constructor() { }

    ngOnInit() {
        if (this.isError) {
            this.messageClass = 'error';
        }
        if (this.message.stack) {
            this.stack = this.message.stack.map(se => se.name).join('/');
        }
        this.text = this.message.desc || this.message.code;
    }

}
