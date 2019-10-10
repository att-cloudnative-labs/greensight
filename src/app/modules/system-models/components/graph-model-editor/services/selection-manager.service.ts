import { Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngxs/store';

import { LayoutEngineService } from './layout-engine.service';
import { GraphNodeDirective } from '@system-models/components/graph-model-editor/graph-node.directive';
import { DraggableNode } from '@system-models/models/graph-model.model';
import { GraphModel } from '@system-models/models/graph-model.model';
import * as graphEditorActions from '@system-models/state/graph-editor.actions';
import { v4 as uuid } from 'uuid';
import { SelectionState } from '@app/modules/system-models/state/selection.state';

@Injectable()
export class SelectionManagerService implements OnDestroy {
    selectables: GraphNodeDirective[] = [];
    originalSelection = [];
    selection = [];
    isDragging: Boolean = false;
    isDraggingSelectionRect: Boolean = false;
    graphModel: GraphModel;
    disabled: Boolean = true;
    private _uuid: string;
    private isAdditive: Boolean = false;

    constructor(
        private layoutEngineService: LayoutEngineService,
        private store: Store
    ) {
        this._uuid = uuid();
        $(document).on(`mousedown.selectionManager.` + this._uuid, (mouseDownEvent: any) => {
            if (this.disabled) {
                return;
            }
            if (mouseDownEvent.button !== 0) {
                return;
            }

            const origin = {
                x: mouseDownEvent.clientX,
                y: mouseDownEvent.clientY
            };

            const dragSelectionRect = mouseDownEvent.target.matches('.grid');
            this.isAdditive = mouseDownEvent.metaKey || mouseDownEvent.shiftKey;
            if (this.isAdditive) {
                this.originalSelection = this.store.selectSnapshot(SelectionState.withNodes);
            }
            else {
                this.originalSelection = [];
            }

            $(document).on(`mousemove.selectionManager.` + this._uuid, (mouseMoveEvent: any) => {
                if (this.disabled) {
                    return;
                }
                if (!this.isDragging && !this.isAdditive && mouseDownEvent.target.matches('.grid')) {
                    this.clear();
                }
                this.isDragging = true;
                if (dragSelectionRect) {
                    this.isDraggingSelectionRect = true;
                    this.dragSelectionRect(origin, mouseMoveEvent);
                }
            });
        });

        $(document).on(`mouseup.selectionManager.` + this._uuid, (mouseUpEvent: any) => {
            if (this.disabled) {
                return;
            }
            if (!(mouseUpEvent.button === 0)) {
                return;
            }

            $(document).off(`mousemove.selectionManager.` + this._uuid);
            if (!this.isDragging && mouseUpEvent.target.matches('.grid')) {
                this.clear();
            }

            this.isDragging = false;
            this.isDraggingSelectionRect = false;
            const ants = this.layoutEngineService.getOffsetParent().parentNode.querySelector('#marching-ants');
            if (ants) {
                ants.setAttribute('display', 'none');
            }
        });
    }

    ngOnDestroy() {
        $(document).off(`mousedown.selectionManager.` + this._uuid);
        $(document).off(`mousemove.selectionManager.` + this._uuid);
        $(document).off(`mouseup.selectionManager.` + this._uuid);
    }

    enable() {
        this.disabled = false;
    }

    disable() {
        this.disabled = true;
    }

    setGraphModel(graphModel) {
        this.graphModel = graphModel;
    }

    dragSelectionRect(origin, mouseMoveEvent) {
        const o = this.layoutEngineService.offsetPoint(origin);
        const d = this.layoutEngineService.offsetPoint({
            x: mouseMoveEvent.clientX,
            y: mouseMoveEvent.clientY
        });
        const ants = this.layoutEngineService.getOffsetParent().parentNode.querySelector('#marching-ants');
        if (ants) {
            ants.setAttribute('display', 'block');
        }

        // no negative widths means annoying stuff

        // V>
        if (d.x >= o.x && d.y >= o.y) {
            ants.setAttribute('transform', `translate(${o.x} ${o.y})`);
            ants.setAttribute('width', d.x - o.x + 'px');
            ants.setAttribute('height', d.y - o.y + 'px');
        }

        // V<
        if (d.x <= o.x && d.y >= o.y) {
            ants.setAttribute('transform', `translate(${d.x} ${o.y})`);
            ants.setAttribute('width', o.x - d.x + 'px');
            ants.setAttribute('height', d.y - o.y + 'px');
        }

        // ^<
        if (d.x < o.x && d.y < o.y) {
            ants.setAttribute('transform', `translate(${d.x} ${d.y})`);
            ants.setAttribute('width', o.x - d.x + 'px');
            ants.setAttribute('height', o.y - d.y + 'px');
        }

        // ^>
        if (d.x >= o.x && d.y < o.y) {
            ants.setAttribute('transform', `translate(${o.x} ${d.y})`);
            ants.setAttribute('width', d.x - o.x + 'px');
            ants.setAttribute('height', o.y - d.y + 'px');
        }

        // TODO: There are some translation issues both in displaying the ants and comparing the ants to the selectables
        const selectionRect = ants.getBoundingClientRect();
        const changes = this.selectables.map(selectable => {
            if (this._isSelectableWithin(selectable, selectionRect)) {
                return this.add(selectable.graphNode);
            } else {
                return this.remove(selectable.graphNode);
            }
        });
        if (changes.find(x => x !== false)) {
            const graphModelId = this.graphModel.id;
            const selection = this.selection.map(graphNode => {
                return {
                    nodeId: graphNode.id,
                    nodeType: graphNode.nodeType
                };
            });
            if (this.originalSelection) {
                this.originalSelection.forEach(graphNode => {
                    if (graphNode.type !== 'TreeNode' && !selection.find(gn => gn.nodeId === graphNode.id)) {
                        selection.push({ nodeId: graphNode.id, nodeType: graphNode.type });
                    }
                });
            }
            this.store.dispatch(new graphEditorActions.DragSelectionChanged({
                graphModelId,
                selection
            }));
        }
    }

    _isSelectableWithin(element, selectionRect) {
        const elementRect = element.getBoundingClientRect();
        if (
            selectionRect.x < elementRect.x + elementRect.width &&
            selectionRect.x + selectionRect.width > elementRect.x &&
            selectionRect.y < elementRect.y + elementRect.height &&
            selectionRect.height + selectionRect.y > elementRect.y
        ) {
            return true;
        } else {
            return false;
        }
    }

    clear() {
        this.selection = [];
        this.store.dispatch(new graphEditorActions.DragSelectionChanged({
            graphModelId: this.graphModel.id,
            selection: this.selection
        }));
    }

    /**
     * Adds a selection to the list of selections as an object
     * @param item the item to select
     */
    add(item: DraggableNode) {
        if (!this.isSelected(item)) {
            this.selection.push(item);
            return this.selection;
        } else {
            return false;
        }
    }

    /**
     * Removes an item from the selection list
     * @param item the item to remove
     */
    remove(item: DraggableNode) {
        const index = this.selection.findIndex(selectedItem => selectedItem === item);
        if (index !== -1) {
            this.selection.splice(index, 1);
            return this.selection;
        } else {
            return false;
        }
    }

    /**
     * Checks if a node is currently selected
     * @param item the object that is to be checked against the selection list
     */
    isSelected(item: DraggableNode) {
        return this.selection.find(selectedItem => selectedItem === item);
    }

    register(selectable: GraphNodeDirective) {
        this.selectables.push(selectable);
    }

    unregister(selectable: GraphNodeDirective) {
        this.selectables = this.selectables.filter(x => x !== selectable);
    }
}
