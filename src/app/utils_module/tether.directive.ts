import { Directive, ElementRef, Input, OnInit, OnDestroy, AfterViewInit, AfterViewChecked } from '@angular/core';
import * as Tether from 'tether';

@Directive({
    selector: '[appTether]'
})
export class TetherDirective implements OnInit, OnDestroy, AfterViewChecked {

    @Input('appTetherTarget') target: string;
    @Input('appTetherTargetAttachment') targetAttachment: string;
    @Input('appTetherAttachment') attachment: string;
    @Input('appTetherOffset') offset: string;
    @Input('appTetherConstraintAttachment') constraintAttachment = 'none';

    private tether: Tether;

    constructor(private el: ElementRef) { }

    // PNS: Is this the correct lifecycle event?
    // I want it to fire after the element (including any children) are re-rendered.
    ngAfterViewChecked() {
        if (this.tether) {
            this.tether.position();
        }
    }

    ngOnInit() {
        this.tether = new Tether(this.tetherOptions());
        this.tether.position();
    }

    ngOnDestroy() {
        this.tether.destroy();
    }

    private tetherOptions() {
        return {
            element: this.el.nativeElement,
            target: this.target,
            targetAttachment: this.targetAttachment,
            attachment: this.attachment,
            offset: this.offset,
            constraints: [
                {
                    to: 'window',
                    attachment: this.constraintAttachment
                }
            ]
        };
    }
}
