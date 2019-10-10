import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { DropListDirective } from './drop-list.directive';

@Injectable({
    providedIn: 'root'
})
export class DragDropRegistryService {
    isDragging = false;
    private dropListInstances = new Set<DropListDirective>();
    readonly pointerMove: Subject<MouseEvent> = new Subject<MouseEvent>();
    readonly pointerUp: Subject<MouseEvent> = new Subject<MouseEvent>();
    readonly dragStart: Subject<any> = new Subject<any>();
    readonly dragStop: Subject<any> = new Subject<any>();

    constructor() { }

    startDragging(dragItem, event) {
        this.isDragging = true;
        this.dragStart.next(dragItem);

        $(document).on(`mousemove.drag-drop-registry`, (mouseMoveEvent) => {
            this.pointerMove.next(mouseMoveEvent.originalEvent as MouseEvent);
        });

        $(document).on(`mouseup.drag-drop-registry`, (mouseUpEvent) => {
            this.pointerUp.next(mouseUpEvent.originalEvent as MouseEvent);
        });
    }

    stopDragging(dragItem, event) {
        this.isDragging = false;
        this.dragStop.next(dragItem);
        $(document).off(`mousemove.drag-drop-registry`);
        $(document).off(`mouseup.drag-drop-registry`);
    }

    registerDropList(dropList: DropListDirective) {
        if (!this.dropListInstances.has(dropList)) {
            this.dropListInstances.add(dropList);
        }
    }

    unregisterDropList(dropList: DropListDirective) {
        this.dropListInstances.delete(dropList);
    }

    getDropListUnder({ x, y }): DropListDirective | null {
        return Array.from(this.dropListInstances).find(dropList => dropList.isUnderPoint({ x, y }));
    }

}
