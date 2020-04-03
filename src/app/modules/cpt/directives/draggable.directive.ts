import { Directive, HostBinding, Input, HostListener } from '@angular/core';

@Directive({
    selector: '[appDraggable]',
    exportAs: 'appDraggable'
})
export class DraggableDirective {
    @Input('appDraggable') public data: any;

    constructor() { }

    @HostBinding('draggable')
    get draggable() {
        return true;
    }

    @HostListener('dragstart', ['$event'])
    onDragStart(event) {
        event.dataTransfer.effectAllowed = 'copy';
        event.dataTransfer.setData('Text', JSON.stringify(this.data));
    }
}
