import { OnInit, Component, Input, HostListener, ViewChild, ViewContainerRef, TemplateRef, OnDestroy } from '@angular/core';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { Store, Select, Actions, ofActionSuccessful } from '@ngxs/store';
import { Observable } from 'rxjs';
import { TreeNode } from '@app/modules/cpt/interfaces/tree-node';
import { LibraryState } from '@app/modules/cpt/state/library.state';
import * as libraryActions from '@app/modules/cpt/state/library.actions';
import * as treeActions from '@app/modules/cpt/state/tree.actions';
import { LibraryComponent } from '@app/modules/cpt/components/library/library.component';
import { Popover } from '@app/modules/cpt/services/popover.service';
import { PermissionsObject } from '@app/modules/cpt/interfaces/permissions';
import { SelectionState, Selection } from '@app/modules/cpt/state/selection.state';
import { Modal } from 'ngx-modialog-7/plugins/bootstrap';
import { ClipboardState, ClipboardStateModel } from '@app/modules/cpt/state/clipboard.state';
import * as clipboardActions from '@app/modules/cpt/state/clipboard.actions';
import { Utils } from '@app/modules/cpt/lib/utils';
import { v4 as uuid } from 'uuid';
import { TreeState } from '@app/modules/cpt/state/tree.state';
import { map } from 'rxjs/operators';

@Component({
    selector: 'app-library-graph-model',
    templateUrl: './library-graph-model.component.html',
    styleUrls: ['./library-graph-model.component.css']
})
export class LibraryGraphModelComponent implements OnInit, OnDestroy {
    simulations$: Observable<TreeNode[]>;
    @Input() graphModel: TreeNode;
    @Input() libChildrenNodes;
    @Select(SelectionState) selection$: Observable<Selection[]>;
    @Select(LibraryState.renameId) renameId$: Observable<string>;
    @Select(ClipboardState.clipboardData) clipboard$: Observable<ClipboardStateModel>;
    @ViewChild('modelElement', { static: true }) modelElement;
    @ViewChild('contextMenu', { static: false }) contextMenu: TemplateRef<any>;

    isSelected = false;
    isInClipboard = false;
    isRename = false;
    hovering = false;
    showPopup = false;
    userRoleId = Utils.getUserRoleId();
    modifyPermissionsObj: PermissionsObject;

    constructor(private store: Store, private libraryComponent: LibraryComponent, private actions$: Actions,
        private popover: Popover, private viewContainerRef: ViewContainerRef, private modal: Modal) { }

    ngOnInit() {
        this.modifyPermissionsObj = { permissions: 'MODIFY', accessObject: this.graphModel };

        this.selection$.pipe(untilDestroyed(this)).subscribe(selection => {
            this.isSelected = !!selection.find(x => x.id === this.graphModel.id);

            if (this.isSelected) {
                this.libraryComponent.scrollToNode(this.modelElement);
            }
        });

        this.renameId$.subscribe(id => {
            this.isRename = id === this.graphModel.id;
        });

        this.simulations$ = this.store
            .select(TreeState.childNodes)
            .pipe(
                map(byId => byId(this.graphModel.id)
                )
            );

        // check if current node is in clipboard
        this.clipboard$.pipe(untilDestroyed(this)).subscribe(clipboard => {
            this.isInClipboard = (clipboard.selections.length !== 0 && clipboard.selections[0].id === this.graphModel.id);
        });

        this.actions$
            .pipe(ofActionSuccessful(treeActions.CreateTreeNode))
            .subscribe((node) => {
                if (node.payload.id === this.graphModel.id) {
                    this.openModelRenameMode();
                }
            });
    }

    ngOnDestroy() { }

    doubleClick() {
        // TODO: Storing panel names this way makes them prone to breakage if the underlying object name changes
        if (!this.isRename) {
            this.store.dispatch(new libraryActions.GraphModelDoubleClicked(this.graphModel));
        }
    }

    addSimulation(event) {
        this.store.dispatch(new treeActions.CreateTreeNode({
            id: uuid(),
            name: this.graphModel.name + ' Simulation',
            parentId: this.graphModel.parentId,
            type: 'SIMULATION',
            ownerName: Utils.getUserName(),
            ref: this.graphModel.id

        }));
    }

    get isHighlighted() {
        return this.showPopup || this.hovering;
    }

    onClick() {
        if (!this.isRename) {
            this.store.dispatch(new libraryActions.GraphModelClicked(this.graphModel));
        }
    }

    onMouseEnter() {
        this.hovering = true;
    }

    onMouseLeave() {
        this.hovering = false;
    }

    renameGraphModel(newName: string) {
        const list = this.libChildrenNodes.filter(node => node.type === 'MODEL' && node.name !== this.graphModel.name);
        if (list.find(node => node.name === newName)) {
            const dialog = this.modal
                .alert()
                .title('Error')
                .isBlocking(true)
                .body('Failed to update model. A model with name "' + newName + '" already exists')
                .open();
            dialog.result.then(result => {
                this.openModelRenameMode();
            });
        } else {
            if (newName !== this.graphModel.name) {
                this.store.dispatch(new libraryActions.RenameGraphModelCommitted(
                    {
                        nodeId: this.graphModel.id,
                        newName: newName
                    }));
            }
        }
        this.store.dispatch(new libraryActions.RenameGraphModelEscaped());
    }


    openModelRenameMode() {
        if (this.isSelected) {
            this.isSelected = false;
        }
        this.store.dispatch(new libraryActions.RenameGraphModelClicked(this.graphModel));
    }

    onCancelRename() {
        this.store.dispatch(new libraryActions.RenameGraphModelEscaped());
    }

    openContextMenu(event) {
        event.stopPropagation();
        event.preventDefault();
        this.showPopup = true;
        if (this.userRoleId !== 'READ_ONLY') {
            this.store.dispatch(new libraryActions.GraphModelContextMenuOpened(this.graphModel));
            this.popover.open({ x: event.x, y: event.y }, this.contextMenu, this.viewContainerRef, { closeOnAnyClick: true, onClose: () => { this.showPopup = false; } });
        }
    }

    @HostListener('document:keydown', ['$event'])
    onCopyModel(event: KeyboardEvent) {
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
