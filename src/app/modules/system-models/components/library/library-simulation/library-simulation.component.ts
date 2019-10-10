import { Component, OnInit, ViewChild, TemplateRef, Input, HostListener, ViewContainerRef, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TreeNode } from '@app/core_module/interfaces/tree-node';
import { TreeState } from '@system-models/state/tree.state';
import { LibraryState } from '@system-models/state/library.state';
import * as libraryActions from '@system-models/state/library.actions';
import * as treeActions from '@system-models/state/tree.actions';
import { LibraryComponent } from '@system-models/components/library/library.component';
import { Select, Store, Actions, ofActionSuccessful } from '@ngxs/store';
import { Popover } from '@app/shared/services/popover.service';
import { PermissionsObject } from '@app/shared/interfaces/permissions';
import { SelectionState, Selection } from '@system-models/state/selection.state';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { Modal } from 'ngx-modialog/plugins/bootstrap';
import { ClipboardState, ClipboardStateModel } from '@system-models/state/clipboard.state';
import * as clipboardActions from '@system-models/state/clipboard.actions';
import { Utils } from '@app/utils_module/utils';

@Component({
    selector: 'app-library-simulation',
    templateUrl: './library-simulation.component.html',
    styleUrls: ['./library-simulation.component.css']
})
export class LibrarySimulationComponent implements OnInit, OnDestroy {
    @Input() simulation: TreeNode;
    @Input() libChildrenNodes;
    @Select(SelectionState) selection$: Observable<Selection[]>;
    @Select(LibraryState.renameId) renameId$: Observable<string>;
    @Select(ClipboardState.clipboardData) clipboard$: Observable<ClipboardStateModel>;
    @ViewChild('simulationElement') simulationElement;
    @ViewChild('contextMenu') contextMenu: TemplateRef<any>;
    childNodes$: Observable<TreeNode[]>;
    isSelected = false;
    isRename = false;
    hovering = false;
    isInClipboard = false;
    userRoleId = Utils.getUserRoleId();
    permissionsObj: PermissionsObject;

    constructor(private store: Store, private libraryComponent: LibraryComponent, private actions$: Actions,
        private popover: Popover, private viewContainerRef: ViewContainerRef, private modal: Modal) { }

    ngOnInit() {
        this.permissionsObj = { permissions: 'MODIFY', accessObject: this.simulation };

        this.childNodes$ = this.store
            .select(TreeState.childNodes)
            .pipe(
                map(byId => byId(this.simulation.id)
                )
            );

        this.selection$.pipe(untilDestroyed(this)).subscribe(selection => {
            this.isSelected = !!selection.find(x => x.id === this.simulation.id);

            if (this.isSelected) {
                this.libraryComponent.scrollToNode(this.simulationElement);
            }
        });

        this.renameId$.subscribe(id => {
            this.isRename = id === this.simulation.id;
        });

        // check if current node is in clipboard
        this.clipboard$.pipe(untilDestroyed(this)).subscribe(clipboard => {
            this.isInClipboard = (clipboard.selections.length !== 0 && clipboard.selections[0].id === this.simulation.id);
        });

        this.actions$
            .pipe(ofActionSuccessful(treeActions.CreateTreeNode))
            .subscribe((node) => {
                if (node.payload.id === this.simulation.id) {
                    this.openSimulationRenameMode();
                }
            });
    }

    ngOnDestroy() { }

    doubleClick() {
        if (!this.isRename) {
            this.store.dispatch(new libraryActions.SimulationDoubleClicked(this.simulation));
        }
    }

    get isHighlighted() {
        return this.hovering;
    }

    onClick() {
        if (!this.isRename) {
            this.store.dispatch(new libraryActions.SimulationClicked(this.simulation));
        }
    }

    openContextMenu(event) {
        event.stopPropagation();
        event.preventDefault();
        if (this.userRoleId !== 'READ_ONLY') {
            this.store.dispatch(new libraryActions.SimulationContextMenuOpened(this.simulation));
            this.popover.open({ x: event.x, y: event.y }, this.contextMenu, this.viewContainerRef);
        }
    }

    onMouseEnter() {
        this.hovering = true;
    }

    onMouseLeave() {
        this.hovering = false;
    }

    openSimulationRenameMode() {
        if (this.isSelected) {
            this.isSelected = false;
        }
        this.store.dispatch(new libraryActions.RenameSimulationClicked(this.simulation));
    }

    renameSimulation(newName: string) {
        const list = this.libChildrenNodes.filter(node => node.type === 'SIMULATION' && node.name !== this.simulation.name);
        if (list.find(node => node.name === newName)) {
            const dialog = this.modal
                .alert()
                .title('Error')
                .isBlocking(true)
                .body('Failed to update simulation. A simulation with name "' + newName + '" already exists')
                .open();
            dialog.result.then(result => {
                this.openSimulationRenameMode();
            });
        } else {
            if (newName !== this.simulation.name) {
                this.store.dispatch(new libraryActions.RenameSimulationCommitted(
                    {
                        nodeId: this.simulation.id,
                        newName: newName
                    }
                ));
            }
        }
        this.store.dispatch(new libraryActions.RenameSimulationEscaped());
    }

    onCancelRename() {
        this.store.dispatch(new libraryActions.RenameSimulationEscaped());
    }

    @HostListener('document:keydown', ['$event'])
    onCopySimulationConfig(event: KeyboardEvent) {
        if (event.ctrlKey && event.key === 'c' && this.isSelected && !$('input').is(':focus') && !$('textarea').is(':focus')) {
            this.store.dispatch(new clipboardActions.NodesCopied());
        }
        if (event.ctrlKey && event.key === 'x' && this.isSelected && !$('input').is(':focus') && !$('textarea').is(':focus')) {
            this.store.dispatch(new clipboardActions.NodesCut());
        }
        if (event.ctrlKey && event.key === 'z' && this.isInClipboard) {
            this.store.dispatch(new clipboardActions.ClipboardDataCleared());
        }
    }
}
