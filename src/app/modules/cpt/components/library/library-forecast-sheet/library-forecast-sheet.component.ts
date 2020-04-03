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

@Component({
    selector: 'app-library-forecast-sheet',
    templateUrl: './library-forecast-sheet.component.html',
    styleUrls: ['./library-forecast-sheet.component.css']
})
export class LibraryForecastSheetComponent implements OnInit, OnDestroy {
    @Input() sheet: TreeNode;
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
        this.modifyPermissionsObj = { permissions: 'MODIFY', accessObject: this.sheet };

        this.selection$.pipe(untilDestroyed(this)).subscribe(selection => {
            this.isSelected = !!selection.find(x => x.id === this.sheet.id);

            if (this.isSelected) {
                this.libraryComponent.scrollToNode(this.modelElement);
            }
        });

        this.renameId$.subscribe(id => {
            this.isRename = id === this.sheet.id;
        });

        // check if current node is in clipboard
        this.clipboard$.pipe(untilDestroyed(this)).subscribe(clipboard => {
            this.isInClipboard = (clipboard.selections.length !== 0 && clipboard.selections[0].id === this.sheet.id);
        });

        this.actions$
            .pipe(ofActionSuccessful(treeActions.CreateTreeNode))
            .subscribe((node) => {
                if (node.payload.id === this.sheet.id) {
                    this.openSheetRenameMode();
                }
            });
    }

    ngOnDestroy() { }

    doubleClick() {
        if (!this.isRename) {
            this.store.dispatch(new libraryActions.ForecastSheetDoubleClicked(this.sheet));
        }
    }

    get isHighlighted() {
        return this.showPopup || this.hovering;
    }

    onClick() {
        if (!this.isRename) {
            this.store.dispatch(new libraryActions.ForecastSheetClicked(this.sheet));
            sessionStorage['active_branch_id'] = this.sheet.id;
            sessionStorage['active_project_id'] = this.sheet.parentId;
        }
    }

    onMouseEnter() {
        this.hovering = true;
    }

    onMouseLeave() {
        this.hovering = false;
    }

    renameForecastSheet(newName: string) {
        const list = this.libChildrenNodes.filter(node => node.type === 'FC_SHEET' && node.name !== this.sheet.name);
        if (list.find(node => node.name === newName)) {
            const dialog = this.modal
                .alert()
                .title('Error')
                .isBlocking(true)
                .body('Failed to update forecast sheet. A sheet with name "' + newName + '" already exists')
                .open();
            dialog.result.then(result => {
                this.openSheetRenameMode();
            });
        } else {
            if (newName !== this.sheet.name) {
                this.store.dispatch(new libraryActions.RenameForecastSheetCommitted(
                    {
                        nodeId: this.sheet.id,
                        newName: newName
                    }));
            }
        }
        this.store.dispatch(new libraryActions.RenameForecastSheetEscaped());
    }


    openSheetRenameMode() {
        if (this.isSelected) {
            this.isSelected = false;
        }
        this.store.dispatch(new libraryActions.RenameForecastSheetClicked(this.sheet));
    }

    onCancelRename() {
        this.store.dispatch(new libraryActions.RenameForecastSheetEscaped());
    }

    openContextMenu(event) {
        event.stopPropagation();
        event.preventDefault();
        this.showPopup = true;
        if (this.userRoleId !== 'READ_ONLY') {
            this.store.dispatch(new libraryActions.ForecastSheetContextMenuOpened(this.sheet));
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
