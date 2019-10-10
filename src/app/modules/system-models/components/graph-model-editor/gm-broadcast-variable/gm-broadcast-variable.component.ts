import { Component, OnInit, ElementRef, OnDestroy, Input, HostBinding } from '@angular/core';

import { Variable, VariableReference } from '@system-models/models/graph-model.model';
import { CablePullService } from '@system-models/components/graph-model-editor/services/cable-pull.service';


@Component({
    selector: 'app-gm-broadcast-variable',
    templateUrl: './gm-broadcast-variable.component.html',
    styleUrls: ['./gm-broadcast-variable.component.css']
})
export class GmBroadcastVariableComponent implements OnInit, OnDestroy {
    @Input() variable: Variable;
    @Input() variableReference: VariableReference;
    @HostBinding('class')
    get portType() { return this.variableReference.portType; }

    constructor(
        private cablePullService: CablePullService,
        private host: ElementRef
    ) { }

    ngOnInit() {
        console.log('initialized', this.variableReference);
        this.cablePullService.registerAnchor({
            nativeElement: this.host.nativeElement.getElementsByClassName('fa')[0],
            portType: this.variableReference.portType,
            id: this.variableReference.id
        });
    }

    ngOnDestroy() {
        this.cablePullService.unregisterAnchor({
            nativeElement: this.host.nativeElement.getElementsByClassName('fa')[0],
            portType: this.variableReference.portType,
            id: this.variableReference.id
        });
    }

}
