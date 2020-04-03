import { Directive, Input, Output, HostListener, EventEmitter } from '@angular/core';

@Directive({
    selector: '[appDropTarget]',
    exportAs: 'appDropTarget'
})
export class DropTargetDirective {
    @Input('appDropTarget') options: any;
    @Output('appOnDrop') drop = new EventEmitter();

    constructor() { }

    @HostListener('dragenter', ['$event'])
    @HostListener('dragover', ['$event'])
    onDragOver(event) {
        event.dataTransfer.dropEffect = 'copy';
        event.preventDefault();
    }

    @HostListener('dragdrop', ['$event'])
    @HostListener('drop', ['$event'])
    onDrop(event) {
        const data = JSON.parse(event.dataTransfer.getData('Text'));
        this.drop.next({
            data,
            event
        });
        event.preventDefault();
    }
}
