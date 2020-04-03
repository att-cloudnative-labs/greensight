import { Directive, Input, ElementRef, OnDestroy, OnInit, HostBinding, HostListener, Host } from '@angular/core';
import { Observable } from 'rxjs';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { Store, Select } from '@ngxs/store';

import { SelectionManagerService } from '@app/modules/cpt/components/graph-model-editor/services/selection-manager.service';
import { DragManagerService } from '@app/modules/cpt/components/graph-model-editor/services/drag-manager.service';
import { DraggableNode } from '@app/modules/cpt/models/graph-model.model';
import * as graphEditorActions from '@app/modules/cpt/state/graph-editor.actions';
import { SelectionState, Selection } from '@app/modules/cpt/state/selection.state';
import { GraphModelEditorComponent } from '@app/modules/cpt/components/graph-model-editor/graph-model-editor.component';

@Directive({
    selector: '[appGraphNode]',
    exportAs: 'appGraphNode'
})
export class GraphNodeDirective implements OnInit, OnDestroy {
    @Input('appGraphNode') public graphNode: DraggableNode;

    _position = { x: 0, y: 0 };
    @Input() set position(position: { x: number, y: number }) {
        this._position = position;
        setTimeout(() => {
            this.graphModelEditorComponent.redrawConnections();
        }, 0);
    }

    @Input() disableDrag = false;
    get position() {
        return this._position;
    }

    @Select(SelectionState) selection$: Observable<Selection[]>;
    @HostBinding('class.isSelected') isSelected = false;
    mouseMovedAfterClick = false;

    constructor(
        private selectionManagerService: SelectionManagerService,
        private dragManagerService: DragManagerService,
        private host: ElementRef,
        private store: Store,
        private graphModelEditorComponent: GraphModelEditorComponent
    ) { }

    ngOnInit() {
        this.selectionManagerService.register(this);
        this.dragManagerService.draggingNodes.pipe(untilDestroyed(this)).subscribe(draggedList => {
            const dragItem = draggedList.find(dragItem => dragItem.node.id === this.graphNode.id);
            if (dragItem) {
                this.position = dragItem.destination;
            }
        });
        this.selection$.pipe(untilDestroyed(this)).subscribe(selection => {
            this.isSelected = !!selection.find(x => x.id === this.graphNode.id);
        });
    }

    ngOnDestroy() {
        this.selectionManagerService.unregister(this);
    }

    // Delegate getBoundingClientRect() to our DOM element so the selection manager can check it.
    getBoundingClientRect() {
        return this.host.nativeElement.getBoundingClientRect();
    }

    @HostBinding('style.transform')
    get portPosition() {
        return 'translate( ' + this.position.x + 'px, ' + this.position.y + 'px)';
    }

    _handleSelection(event) {
        const modifierKeys = ['Shift', 'Meta'].filter(x => event.getModifierState(x));
        if (event.type === 'dblclick') {
            this.store.dispatch(new graphEditorActions.NodeDoubleClicked({
                graphModelId: this.graphNode.graphModel.id,
                nodeId: this.graphNode.id,
                nodeType: this.graphNode.nodeType,
                modifierKeys,
                eventType: event.type,
                graphModelReleaseNr: this.graphNode.graphModel.releaseNr
            }));
        } else {
            this.store.dispatch(new graphEditorActions.NodeSelected({
                graphModelId: this.graphNode.graphModel.id,
                nodeId: this.graphNode.id,
                nodeType: this.graphNode.nodeType,
                modifierKeys,
                graphModelReleaseNr: this.graphNode.graphModel.releaseNr
            }));
        }
    }

    @HostListener('dblclick', ['$event'])
    doubleClick(doubleClickEvent) {
        this._handleSelection(doubleClickEvent);
    }

    @HostListener('mousedown', ['$event'])
    mouseDown(mouseDownEvent) {
        let deleteOccured = false;
        if (mouseDownEvent.defaultPrevented || mouseDownEvent.button !== 0) {
            return;
        }
        this.mouseMovedAfterClick = false;

        $(document).on(`keyup.${this.graphNode.id}`, (e) => {
            if (e.keyCode === 46 || e.keyCode === 8) {
                deleteOccured = true;
            }
        });

        if (!this.isSelected) {
            this._handleSelection(mouseDownEvent);
        }

        if (this.disableDrag) {
            return;
        }

        $(document).on(`mousemove.${this.graphNode.id}`, (mouseMoveEvent) => {
            if (deleteOccured) {
                return;
            }
            this.mouseMovedAfterClick = true;
            // select node before dragging if not already selected
            if (!this.isSelected) {
                this._handleSelection(mouseDownEvent);
            }
            this.dragManagerService.startDragging({
                x: mouseDownEvent.clientX,
                y: mouseDownEvent.clientY
            });
            $(document).off(`mousemove.${this.graphNode.id}`);
            $(document).off(`keyup.${this.graphNode.id}`);
        });
    }

    @HostListener('mouseup', ['$event'])
    mouseUp(mouseUpEvent) {
        if (!mouseUpEvent.defaultPrevented && !this.mouseMovedAfterClick) {
            // this._handleSelection(mouseUpEvent);
            $(document).off(`mousemove.${this.graphNode.id}`);
        }
    }

}
