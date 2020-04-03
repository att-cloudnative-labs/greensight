import { Directive, OnInit, ElementRef, Output, EventEmitter } from '@angular/core';
import * as elementResizeDetectorMaker from 'element-resize-detector';

@Directive({
    selector: '[appElementResizeDetector]'
})
export class ElementResizeDetectorDirective implements OnInit {
    @Output() onSizeChanged = new EventEmitter<any>();

    // erd = elementResizeDetectorMaker();
    private erd = elementResizeDetectorMaker({
        strategy: 'scroll'
    });

    constructor(private el: ElementRef) { }

    ngOnInit() {
        this.erd.listenTo(this.el.nativeElement, (element) => {
            this.onSizeChanged.emit({ width: element.offsetWidth, height: element.offsetHeight });
        });
    }
}
