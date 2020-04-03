import {
    Component,
    Input,
    ViewContainerRef,
    ViewChild,
    TemplateRef,
    ViewChildren,
    QueryList,
    ElementRef,
    OnInit,
    HostListener,
    OnDestroy,
    OnChanges
} from '@angular/core';
import { Observable, combineLatest, of, BehaviorSubject, interval } from 'rxjs';
import { map, filter, catchError, debounce, take } from 'rxjs/operators';
import { untilDestroyed } from 'ngx-take-until-destroy';

import { GmConnectionComponent } from './gm-connection/gm-connection.component';
import { CablePullService } from '@cpt/components/graph-model-editor/services/cable-pull.service';
import { SelectionManagerService } from '@cpt/components/graph-model-editor/services/selection-manager.service';
import { LayoutEngineService } from '@cpt/components/graph-model-editor/services/layout-engine.service';
import { DragManagerService } from '@cpt/components/graph-model-editor/services/drag-manager.service';
import { ScaleService } from '@cpt/components/graph-model-editor/services/scale.service';
import { PanService } from '@cpt/components/graph-model-editor/services/pan.service';
import { Actions, ofActionSuccessful, Select, Store } from '@ngxs/store';
import { TreeNode } from '@cpt/interfaces/tree-node';
import { TreeState } from '@cpt/state/tree.state';
import * as graphEditorActions from '@cpt/state/graph-editor.actions';
import * as treeActions from '@cpt/state/tree.actions';

import { fetchPid, GraphModel, pidFromGraphModelNode } from '@cpt/models/graph-model.model';
import { synchronizeGraphModel } from '@cpt/lib/synchronize-graph-model';
import { ProcessingElementState, ProcessingElementStateModel } from '@cpt/state/processing-element.state';
import { transform, isEqual, isObject } from 'lodash';
import { Popover } from '@cpt/services/popover.service';
import * as clipboardActions from '@cpt/state/clipboard.actions';
import { ClipboardState, ClipboardStateModel } from '@cpt/state/clipboard.state';
import { Selection, SelectionState } from '@cpt/state/selection.state';
import * as gmInportDetailsActions from '@cpt/state/gm-inport-details.actions';
import * as gmProcessDetailsActions from '@cpt/state/gm-process-details.actions';
import * as gmVariableReferenceDetailsActions from '@cpt/state/gm-variable-reference-details.actions';
import { ProcessInterfaceDescription } from '@cpt/capacity-planning-simulation-types/lib';
import { TreeService } from '@cpt/services/tree.service';
import { LoadGraphModelDependencies } from '@cpt/state/processing-element.actions';
import { ApplicationState } from '@cpt/state/application.state';
import { GraphModelInterfaceState, GraphModelInterfaceStateModel } from '@cpt/state/graph-model-interface.state';
import { ReleaseState } from '@cpt/state/release.state';
import { ReleaseFetch } from '@cpt/state/release.actions';


class StateHistory {
    private past = [];
    private present;
    private future = [];

    constructor(initialState) {
        this.present = initialState;
    }

    private diffState(a, b) {
        function changes(a, b) {
            return transform(a, function(result, value, key) {
                if (!isEqual(value, b[key])) {
                    result[key] = (isObject(value) && isObject(b[key])) ? changes(value, b[key]) : value;
                }
            });
        }
        return changes(a, b);
    }


    public add(state) {
        // TODO: A more elegant solution for this.
        // Right now every time the graphModelNode is updated in the state a new StateHistory entry is added.
        // When undoing and redoing, the graphModelNode is updated which results in this being called which
        // pollutes this history and makes multiple undo or ANY redo impossible. To circumvent this we diff
        // the two states and make sure that the only difference is the version, ensuring that we only get
        // a single StateHistory entry for that action.
        const diff = this.diffState(state, this.present);
        if (isEqual(diff, { version: state.version })) {
            return;
        }

        this.past.push(this.present);
        this.present = state;
        return this.present;
    }

    public undo() {
        const previous = this.past[this.past.length - 2];
        const future = this.past[this.past.length - 1];
        this.present = previous;
        this.past = this.past.slice(0, this.past.length - 1);
        this.future = [future, ...this.future];
        return this.present;
    }

    public redo() {
        const next = this.future[0];
        this.past = [...this.past, this.present];
        this.present = next;
        this.future = this.future.slice(1);
        return this.present;
    }

    get hasPast(): boolean {
        return !!this.past.length;
    }

    get hasFuture(): boolean {
        return !!this.future.length;
    }
}

@Component({
    selector: 'app-graph-model-editor',
    templateUrl: './graph-model-editor.component.html',
    providers: [
        CablePullService,
        SelectionManagerService,
        LayoutEngineService,
        DragManagerService,
        PanService,
        ScaleService,
    ],
    styleUrls: ['./graph-model-editor.component.scss'],
})
export class GraphModelEditorComponent implements OnInit, OnDestroy, OnChanges {

    @Input() nodeId: string;
    @Input('releaseNr') releaseNr: number;
    graphModel: GraphModel;
    @ViewChildren(GmConnectionComponent) graphConnectionElements: QueryList<GmConnectionComponent>;
    @ViewChild('variablePicker', { static: false }) variablePicker: TemplateRef<any>;
    @Select(ProcessingElementState) peState$: Observable<ProcessingElementStateModel>;
    @Select(ProcessingElementState.processingElements) processingElements$: Observable<any[]>;
    @Select(TreeState.nodesOfType('MODEL')) graphModelNodes$: Observable<TreeNode[]>;
    @Select(ClipboardState.clipboardData) clipboard$: Observable<ClipboardStateModel>;
    @Select(SelectionState) selection$: Observable<Selection[]>;
    isFocused = false;
    stateHistory: StateHistory;
    clipboardHasData: boolean;
    selection: any;
    visibleGraph = true;
    editingEnabled = true;
    visibleGraph$ = new BehaviorSubject<boolean>(false);

    // TODO: Right now we are counting on PanService to be instantiated so we need to include it in the constructor
    //          even though we don't use it. I think there may be a better way to organize these aspects of the editor.
    constructor(
        public cablePullService: CablePullService,
        private selectionManagerService: SelectionManagerService,
        public layoutEngineService: LayoutEngineService,
        private dragManagerService: DragManagerService,
        private scaleService: ScaleService,
        private panService: PanService,
        private treeService: TreeService,
        private _el: ElementRef,
        private store: Store,
        private popover: Popover,
        private viewContainerRef: ViewContainerRef,
        private actions$: Actions) { }

    get readonly() {
        return !!this.releaseNr;
    }

    ngOnInit() {


        this.cablePullService.pullComplete.pipe(untilDestroyed(this)).subscribe(this.handleCablePullComplete.bind(this));
        this.cablePullService.pullDrop.pipe(untilDestroyed(this)).subscribe(this.handleCablePullDrop.bind(this));
        this.dragManagerService.stopDragging.pipe(untilDestroyed(this)).subscribe(this.handleDragComplete.bind(this));



        this.store.select(ApplicationState).pipe(untilDestroyed(this), filter(as => as.ready), take(1)).subscribe(as => {
            // FIXME: we should limit this to only trigger if the actual data updates.
            // at the moment this breaks because the processInterfaceDescriptions will not
            // get updated correctly if we don't run on every update.
            // a way out would be to emit the processInterfaceDescriptions from state
            // whenever they get updated and have the graph model listen for those changes

            const filteredNode$ = this.store
                .select(TreeState.nodeById)
                .pipe(
                    map(byId => byId(this.nodeId)),
                    untilDestroyed(this),
                    filter(node => !!node),
                    filter(node => !this.graphModel || node.content)
                    // filter(node => !this.graphModel || this.graphModel.version !== node.version)
                );

            const releaseNode$ = this.store.select(ReleaseState.id(this.nodeId, this.releaseNr)).pipe(
                untilDestroyed(this),
                filter(release => !!release),
                map(release => release.treeNode),
                filter(treeNode => !this.graphModel || treeNode.content)
            );

            const nodeSrc$ = this.releaseNr ? releaseNode$ : filteredNode$;
            combineLatest([nodeSrc$, this.visibleGraph$]).pipe(debounce(() => interval(500))).subscribe(([graphModelNode, visible]) => {
                if (this.editingEnabled && graphModelNode.content && visible) {
                    this.store.dispatch(new LoadGraphModelDependencies({ dependencies: Object.values(graphModelNode.content.processes) })).subscribe(state => {
                        const gms = this.store.selectSnapshot(GraphModelInterfaceState) as GraphModelInterfaceStateModel;
                        const pes = this.store.selectSnapshot(ProcessingElementState) as ProcessingElementStateModel;
                        const getPids = (p) => GraphModelInterfaceState.findPidDirect(gms, pes, p);

                        if (this.graphModel) {
                            this.graphModel.update(graphModelNode, getPids);
                            this.stateHistory.add(graphModelNode);
                        } else {
                            this.stateHistory = new StateHistory(graphModelNode);
                            this.graphModel = new GraphModel(graphModelNode, getPids);
                            this.init();
                        }
                        if (!this.readonly) {
                            const gmn = this.store.selectSnapshot(TreeState.nodes).find(n => n.id === this.nodeId);
                            if (gmn) {
                                synchronizeGraphModel(gmn, getPids, async (gmn) => {
                                    await this.store.dispatch(new treeActions.UpdateTreeNode(gmn)).toPromise();
                                    return this.store.selectSnapshot(TreeState.nodesOfType('MODEL')).find(x => x.id === gmn.id);
                                });
                            }
                        }
                    });
                }
            });

            const loadAction = this.releaseNr ? new ReleaseFetch({ nodeId: this.nodeId, releaseNr: this.releaseNr }) : new treeActions.LoadGraphModelContent({ id: this.nodeId });
            this.store.dispatch(loadAction).subscribe(() => {
                combineLatest([this.selection$, this.clipboard$])
                    .pipe(
                        untilDestroyed(this),
                    )
                    .subscribe(([selection, clipboard]) => {
                        if (this.editingEnabled) {
                            if (selection) {
                                this.selection = selection.filter(s => s.context === this.nodeId);
                            }
                            this.clipboardHasData = (clipboard.selections.length !== 0);
                        }
                    });

                this.actions$.pipe(ofActionSuccessful(gmInportDetailsActions.NameChanged,
                    gmProcessDetailsActions.LabelChanged, gmVariableReferenceDetailsActions.VariableLabelChanged), untilDestroyed(this)).subscribe(() => {
                        if (this.editingEnabled) {
                            this.redrawConnections();
                        }
                    });
            });

        });


    }
    ngOnChanges(): void {
    }

    private nodesAndPEsToDescriptions(allGraphModelNodes, processingElements): ProcessInterfaceDescription[] {
        const processInterfaceDescriptions: ProcessInterfaceDescription[] = [];
        processingElements.forEach(pe => {
            processInterfaceDescriptions.push(pe);
        });
        allGraphModelNodes.forEach(gmn => {
            if (gmn.processInterface !== null) {
                processInterfaceDescriptions.push(pidFromGraphModelNode(gmn));
            }
        });
        return processInterfaceDescriptions;
    }

    init() {
        this.selectionManagerService.setGraphModel(this.graphModel);
        this.cablePullService.setGraphModel(this.graphModel);
        setTimeout(() => {
            this.layoutEngineService.setSelectRectangleParent(this._el.nativeElement);
            const offsetParent = this._el.nativeElement.getElementsByClassName('processes')[0];
            this.layoutEngineService.setOffsetParent(offsetParent);
        }, 0);
    }

    /*
    * This lifecycle handler must be defined in order for untilDestroyed to work correctly
    */
    ngOnDestroy() {
    }

    enableUserInput() {
        this.visibleGraph = true;
        this.selectionManagerService.enable();
        this.panService.enable();
        setTimeout(() => {
            this.redrawConnections();
        }, 0);
        this.visibleGraph$.next(this.visibleGraph);
    }

    disableUserInput() {
        this.visibleGraph = false;
        this.selectionManagerService.disable();
        this.panService.disable();
        this.visibleGraph$.next(this.visibleGraph);
    }

    /*
    * Redraw all connections
    */
    public redrawConnections() {
        this.graphConnectionElements.forEach(x => x.redraw());
    }

    get marchingAntsStyle() {
        if (this.selectionManagerService.isDraggingSelectionRect) {
            return 'block';
        } else {
            return 'none';
        }
    }

    /**
     * Creates a new connection when the mouse is dragged from one port to another port
     * @param newConnection the connection that was created by dragging the mouse
     */
    handleCablePullComplete(newConnection) {
        if (!this.readonly) {
            this.store.dispatch(new graphEditorActions.CablePullComplete({
                graphModelId: this.graphModel.id,
                newConnection
            }));
        }

    }

    handleCablePullDrop(mouseEvent: MouseEvent) {
        this.popover.open(
            {
                x: mouseEvent.clientX,
                y: mouseEvent.clientY
            },
            this.variablePicker,
            this.viewContainerRef,
            {
                closeOnAnyClick: false,
                onClose: () => {
                    this.cablePullService.dropComplete();
                }
            }
        );
    }

    handleDragComplete(draggedList) {
        if (draggedList.length && !this.readonly) {
            this.store.dispatch(new graphEditorActions.Drop({
                graphModelId: this.graphModel.id,
                draggedList
            }));
        }
    }

    // An item from an external source (e.g. control bar) dropped on grid
    itemDropped({ data, event }) {
        if (this.readonly) {
            return;
        }
        const position = this.layoutEngineService.translatePoint({
            x: event.clientX - 6,
            y: event.clientY - 18
        });

        this.store.dispatch(new graphEditorActions.ItemDropped({
            graphModelId: this.graphModel.id,
            dropData: data,
            position
        }));
    }

    /**
     * Deletes all connections coming in or out of a specified port
     * @param direction whether its an incoming/outgoing port
     * @param portName the name associated with the port
     * @param id the unique identifier of the node associated with the port
     */
    clearPort(portId) {
        if (!this.readonly) {
            this.store.dispatch(new graphEditorActions.PortPinShiftClicked({
                graphModelId: this.graphModel.id,
                portId
            }));
        }
    }

    @HostListener('document:keydown.delete', ['$event'])
    @HostListener('document:keydown.backspace', ['$event'])
    onDeletePressed() {
        if (this.isFocused && !this.readonly) {
            const selection = this.store.selectSnapshot(state => state.selection);
            this.store.dispatch(new graphEditorActions.DeleteKeyPressed({
                graphModelId: this.graphModel.id,
                selection
            })).pipe(catchError(e => of(e)));
        }
    }

    transformStyle() {
        return {
            'transform': 'translate( ' + this.layoutEngineService.x + 'px, ' + this.layoutEngineService.y + 'px) scale(' + this.layoutEngineService.scale + ')'
        };
    }

    @HostListener('wheel', ['$event'])
    handleOnWheel(wheelEvent) {
        if (wheelEvent.metaKey || wheelEvent.ctrlKey) {
            this.scaleService.scaleOnWheel(wheelEvent);
        } else {
            this.panService.panOnWheel(wheelEvent);
        }
    }

    @HostListener('document:mousedown', ['$event', '$event.target'])
    mouseDown(mouseDownEvent: MouseEvent, targetElement: HTMLElement) {
        const clickedInside = this._el.nativeElement.contains(targetElement) && !targetElement.closest('app-graph-control-bar');
        this.isFocused = clickedInside;
    }

    /**
     * Handle keyboard on graph editor
     * Quick and dirty undo/redo
     * Cut/Copy/Paste
     * @param $event
     */
    @HostListener('document:keydown', ['$event'])
    onKeyDown($event: KeyboardEvent) {
        if (this.visibleGraph && !this.readonly) {
            // 'Z' key event is capital Z not lowercase z, don't change below $event.key to z.
            if (($event.ctrlKey || $event.metaKey) && $event.shiftKey && $event.key === 'Z') {
                // redo
                if (this.stateHistory.hasFuture) {
                    const previousState = this.stateHistory.redo();
                    this.store.dispatch(new graphEditorActions.RedoPerformed({
                        graphModelId: this.graphModel.id,
                        graphModelNode: previousState
                    }));
                }
            } else if (($event.ctrlKey || $event.metaKey) && $event.key === 'z' && !this.clipboardHasData) {
                // undo
                if (this.stateHistory.hasPast) {
                    const nextState = this.stateHistory.undo();
                    this.store.dispatch(new graphEditorActions.UndoPerformed({
                        graphModelId: this.graphModel.id,
                        graphModelNode: nextState
                    }));
                }
            } else if (($event.ctrlKey || $event.metaKey) && $event.key === 'z' && this.clipboardHasData) {
                this.store.dispatch(new clipboardActions.ClipboardDataCleared());
            } else if (($event.ctrlKey || $event.metaKey) && $event.key === 'c' && this.selection[0].context === this.graphModel.id) {
                this.store.dispatch(new clipboardActions.GraphModelElementsCopied());
            } else if (($event.ctrlKey || $event.metaKey) && $event.key === 'v' && this.clipboardHasData) {
                const offsetParent = this.layoutEngineService.selectRectangleParent;
                const position = this.layoutEngineService.translatePoint({
                    x: offsetParent.offsetLeft + 100,
                    y: offsetParent.offsetTop + 200
                });
                this.store.dispatch(new clipboardActions.GraphModelElementsPasted(this.graphModel.id, position));
            }
        }
    }

    @HostListener('document:dblclick')
    doubleClick() {
        this.isFocused = false;
    }
}
