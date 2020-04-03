import { Component, OnInit, ViewChild, TemplateRef, Input, HostListener, ViewContainerRef, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { TreeNode } from '@app/modules/cpt/interfaces/tree-node';
import { LibraryState } from '@app/modules/cpt/state/library.state';
import * as libraryActions from '@app/modules/cpt/state/library.actions';
import * as treeActions from '@app/modules/cpt/state/tree.actions';
import { LibraryComponent } from '@app/modules/cpt/components/library/library.component';
import { Select, Store, Actions, ofActionSuccessful } from '@ngxs/store';
import { Popover } from '@app/modules/cpt/services/popover.service';
import { PermissionsObject } from '@app/modules/cpt/interfaces/permissions';
import { SelectionState, Selection } from '@app/modules/cpt/state/selection.state';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { Utils } from '@app/modules/cpt/lib/utils';

@Component({
    selector: 'app-library-simulation-result',
    templateUrl: './library-simulation-result.component.html',
    styleUrls: ['./library-simulation-result.component.css']
})
export class LibrarySimulationResultComponent implements OnInit, OnDestroy {
    @Input() simulationResult: TreeNode;
    @Select(SelectionState) selection$: Observable<Selection[]>;
    @Select(LibraryState.renameId) renameId$: Observable<string>;
    @ViewChild('simulationResultElement', { static: true }) simulationResultElement;
    @ViewChild('contextMenu', { static: false }) contextMenu: TemplateRef<any>;
    isSelected = false;
    isRename = false;
    hovering = false;
    showPopup = false;
    userRoleId = Utils.getUserRoleId();
    permissionsObj: PermissionsObject;

    constructor(private store: Store, private libraryComponent: LibraryComponent, private actions$: Actions,
        private popover: Popover, private viewContainerRef: ViewContainerRef) { }

    ngOnInit() {
        this.permissionsObj = { permissions: 'MODIFY', accessObject: this.simulationResult };

        this.selection$.pipe(untilDestroyed(this)).subscribe(selection => {
            this.isSelected = !!selection.find(x => x.id === this.simulationResult.id);

            if (this.isSelected) {
                this.libraryComponent.scrollToNode(this.simulationResultElement);
            }
        });

        this.renameId$.subscribe(id => {
            this.isRename = id === this.simulationResult.id;
        });

        this.actions$
            .pipe(ofActionSuccessful(treeActions.CreateTreeNode))
            .subscribe((node) => {
                if (node.payload.id === this.simulationResult.id) {
                    this.openSimulationResultRenameMode();
                }
            });
    }

    ngOnDestroy() { }

    doubleClick() {
        if (!this.isRename) {
            this.store.dispatch(new libraryActions.SimulationResultDoubleClicked(this.simulationResult));
        }
    }

    get isHighlighted() {
        return this.showPopup || this.hovering;
    }

    onClick() {
        if (!this.isRename) {
            this.store.dispatch(new libraryActions.SimulationResultClicked(this.simulationResult));
        }
    }

    openContextMenu(event) {
        event.stopPropagation();
        event.preventDefault();
        this.showPopup = true;
        if (this.userRoleId !== 'READ_ONLY') {
            this.store.dispatch(new libraryActions.SimulationResultContextMenuOpened(this.simulationResult));
            this.popover.open({ x: event.x, y: event.y }, this.contextMenu, this.viewContainerRef, { closeOnAnyClick: true, onClose: () => { this.showPopup = false; } });
        }
    }

    onMouseEnter() {
        this.hovering = true;
    }

    onMouseLeave() {
        this.hovering = false;
    }

    openSimulationResultRenameMode() {
        if (this.isSelected) {
            this.isSelected = false;
        }
        this.store.dispatch(new libraryActions.RenameSimulationResultClicked(this.simulationResult));
    }

    renameSimulationResult(newName: string) {
        if (newName !== this.simulationResult.name) {
            this.store.dispatch(new libraryActions.RenameSimulationResultCommitted(
                {
                    nodeId: this.simulationResult.id,
                    newName: newName
                }
            ));
        }
        this.store.dispatch(new libraryActions.RenameSimulationResultEscaped());
    }

    onCancelRename() {
        this.store.dispatch(new libraryActions.RenameSimulationResultEscaped());
    }
}
