import { Directive, Output, EventEmitter, OnInit, OnDestroy, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';

import { DragDropRegistryService } from '../services/drag-drop-registry.service';
import { DragItemDirective } from './drag-item.directive';

@Directive({
    selector: '[appDropList]'
})
export class DropListDirective implements OnInit, OnDestroy {
    @Output('appDropListDrop') dropped: EventEmitter<DragItemDirective> = new EventEmitter();
    private dragStartSubscription = Subscription.EMPTY;
    private dragStopSubscription = Subscription.EMPTY;

    constructor(
        private element: ElementRef<HTMLElement>,
        private dragDropRegistry: DragDropRegistryService
    ) { }

    ngOnInit() {
        this.dragDropRegistry.registerDropList(this);
        this.dragStartSubscription = this.dragDropRegistry.dragStart.subscribe(this.dragStart);
        this.dragStopSubscription = this.dragDropRegistry.dragStop.subscribe(this.dragStop);
    }

    ngOnDestroy() {
        this.dragDropRegistry.unregisterDropList(this);
        this.dragStartSubscription.unsubscribe();
        this.dragStopSubscription.unsubscribe();
    }

    isUnderPoint({ x, y }) {
        const rect = this.element.nativeElement.getBoundingClientRect();
        return rect.left <= x && x <= rect.right && rect.top <= y && y <= rect.bottom;
    }

    enter() {
        this.element.nativeElement.classList.add('app-drop-list-over');
    }

    exit() {
        this.element.nativeElement.classList.remove('app-drop-list-over');
    }

    dragStart = () => {
        this.element.nativeElement.classList.add('app-drop-list-drag-active');
    }

    dragStop = () => {
        this.element.nativeElement.classList.remove('app-drop-list-drag-active');
    }

    drop(dragItem: DragItemDirective) {
        this.dropped.next(dragItem);
        this.element.nativeElement.classList.remove('app-drop-list-over');
    }
}
