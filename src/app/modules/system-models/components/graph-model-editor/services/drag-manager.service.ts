import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Store } from '@ngxs/store';

import { LayoutEngineService } from './layout-engine.service';
import { SelectionState } from '@system-models/state/selection.state';

@Injectable()
export class DragManagerService {
    isDragging: Boolean = false;
    draggingNodes = new BehaviorSubject([]);
    stopDragging = new BehaviorSubject([]);
    draggedList = [];

    constructor(
        private layoutEngineService: LayoutEngineService,
        private store: Store
    ) { }

    /**
     * Calculates the new x and y coordinates of a node that is to be dragged using
     * the mouse
     * @param origin the original position of the node that is to be dragged
     */
    startDragging(origin) {
        const selection = this.store.selectSnapshot(SelectionState.withNodes);
        const dragSelection = selection.map(selected => {
            const node = selected.object;

            // retrieve its original x, y coordinates along with the node's id and type
            return {
                ox: node.metadata.x,
                oy: node.metadata.y,
                node: {
                    ...node,
                    id: selected.id
                }, // TODO: add ids to nodes in graphModelNode.content structure
            };
        });

        $(document).on(`mousemove.dragmanager`, (mouseMoveEvent) => {
            if (!this.isDragging) {
                this.isDragging = true;
            }

            const offset = {
                x: mouseMoveEvent.clientX - origin.x,
                y: mouseMoveEvent.clientY - origin.y
            };
            const translatedOffset = this.layoutEngineService.translateOffset(offset);

            this.draggedList = dragSelection.map(dragItem => {
                const destination = {
                    x: dragItem.ox + translatedOffset.x,
                    y: dragItem.oy + translatedOffset.y
                };

                return {
                    ...dragItem,
                    destination
                };
            });

            this.draggingNodes.next(this.draggedList);
        });

        // when mouse is released
        $(document).on(`mouseup.dragmanager`, (mouseUpEvent) => {
            $(document).off(`mousemove.dragmanager`);
            $(document).off(`mouseup.dragmanager`);
            this.isDragging = false;
            // push that dragging has ceased
            this.stopDragging.next(this.draggedList);
            this.draggedList = [];
        });
    }
}
