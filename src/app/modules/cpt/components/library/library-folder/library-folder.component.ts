import {
    OnInit,
    Component,
    Input,
    ViewChild,
    TemplateRef,
    ViewContainerRef,
    OnDestroy,
    HostListener
} from '@angular/core';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { TreeNode, } from '@app/modules/cpt/interfaces/tree-node';
import { TreeNodeProperties } from '@app/modules/cpt/state/library.actions';

import { TreeState } from '@app/modules/cpt/state/tree.state';
import { Select, Store, Actions, ofActionSuccessful } from '@ngxs/store';
import { merge, Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { LibraryState } from '@app/modules/cpt/state/library.state';
import * as libraryActions from '@app/modules/cpt/state/library.actions';
import * as treeActions from '@app/modules/cpt/state/tree.actions';
import * as layoutActions from '@app/modules/cpt/state/layout.actions';
import { Utils } from '@app/modules/cpt/lib/utils';

import { LibraryComponent } from '@app/modules/cpt/components/library/library.component';
import { v4 as uuid } from 'uuid';
import { Popover } from '@app/modules/cpt/services/popover.service';
import { PermissionsObject } from '@app/modules/cpt/interfaces/permissions';
import { SelectionState, Selection } from '@app/modules/cpt/state/selection.state';
import * as clipboardActions from '@app/modules/cpt/state/clipboard.actions';
import { ClipboardState, ClipboardStateModel } from '@app/modules/cpt/state/clipboard.state';

@Component({
    selector: 'app-library-folder',
    templateUrl: './library-folder.component.html',
    styleUrls: ['./library-folder.component.css']
})
export class LibraryFolderComponent implements OnInit, OnDestroy {
    @Input() folder: TreeNode;
    @Input() filteredResult = false;
    @Select(SelectionState) selection$: Observable<Selection[]>;
    @Select(LibraryState.renameId) renameId$: Observable<string>;
    @Select(ClipboardState.clipboardData) clipboard$: Observable<ClipboardStateModel>;
    @ViewChild('folderElement', { static: true }) folderElement;
    @ViewChild('contextMenu', { static: false }) contextMenu: TemplateRef<any>;
    childNodes$: Observable<TreeNode[]>;
    treeNodeProperties$: Observable<TreeNodeProperties>;

    clipboardHasData = false;
    showPopup = false;
    hovering = false;
    isSelected = false;
    isRename = false;
    isExpanded = false;
    isOwner = false;
    userRoleId = Utils.getUserRoleId();
    createPermissionsObj: PermissionsObject;
    modifyPermissionsObj: PermissionsObject;
    isInClipboard = false;
    loadingOrEmpty: Observable<string>;


    get isHighlighted() {
        return this.showPopup || this.hovering;
    }

    get isPrivate() {
        return this.folder.accessControl === 'PRIVATE';
    }

    get isReadOnly() {
        return this.folder.accessControl === 'PUBLIC_READ_ONLY';
    }

    constructor(private store: Store, private libraryComponent: LibraryComponent, private actions$: Actions,
        private popover: Popover, private viewContainerRef: ViewContainerRef) { }

    ngOnInit() {

        this.loadingOrEmpty = merge<string>(of('Loading'), of('Empty').pipe(delay(3000)));

        this.createPermissionsObj = { permissions: 'CREATE', accessObject: this.folder };
        this.modifyPermissionsObj = { permissions: 'MODIFY', accessObject: this.folder };

        this.childNodes$ = this.store
            .select(TreeState.childNodes)
            .pipe(
                map(byId => byId(this.folder.id),
                )
            );

        this.treeNodeProperties$ = this.store
            .select(LibraryState.treeNodePropertiesMap)
            .pipe(
                map(byId => byId(this.folder.id)
                )
            );

        this.treeNodeProperties$.subscribe(treeNodeProperties => {
            if (treeNodeProperties) {
                this.isExpanded = treeNodeProperties.isExpanded;
            }
        });

        this.selection$.pipe(untilDestroyed(this)).subscribe(selection => {
            this.isSelected = !!selection.find(x => x.id === this.folder.id);

            if (this.isSelected) {
                this.libraryComponent.scrollToNode(this.folderElement);
            }
        });

        this.renameId$.subscribe(id => {
            this.isRename = id === this.folder.id;
        });

        this.actions$
            .pipe(ofActionSuccessful(treeActions.CreateTreeNode))
            .subscribe((node) => {
                if (node.payload.id === this.folder.id) {
                    this.libraryComponent.scrollToNode(this.folderElement);
                    this.openFolderRenameMode();
                }
            });
        this.isOwner = Utils.getUserName() === this.folder.ownerName;

        // check if there is data in clipboard
        this.clipboard$.pipe(untilDestroyed(this)).subscribe(clipboard => {
            this.clipboardHasData = (clipboard.selections.length !== 0);
            this.isInClipboard = (clipboard.selections.length !== 0 && clipboard.selections[0].id === this.folder.id);
        });
    }

    ngOnDestroy() {

    }

    openContextMenu(event) {
        event.stopPropagation();
        event.preventDefault();
        this.showPopup = true;
        if (this.userRoleId !== 'READ_ONLY') {
            this.store.dispatch(new libraryActions.FolderContextMenuOpened(this.folder));
            this.popover.open({ x: event.x, y: event.y }, this.contextMenu, this.viewContainerRef, { closeOnAnyClick: true, onClose: () => { this.showPopup = false; } });
        }
    }

    onMouseEnter() {
        this.hovering = true;
    }

    // only unhighlight the folder if it doesnt have its popup menu open
    onMouseLeave() {
        this.hovering = false;
    }

    onClick() {
        if (!this.isRename) {
            this.store.dispatch(new libraryActions.FolderClicked(this.folder));
        }
    }

    addModel(event) {
        event.stopPropagation();
        if (!this.isExpanded) {
            this.toggleExpanded(event);
        }
        this.store.dispatch(new treeActions.CreateTreeNode({
            id: uuid(),
            name: 'New Model',
            parentId: this.folder.id,
            type: 'MODEL',
            ownerName: Utils.getUserName()

        }));
    }
    addForecastSheet(event) {
        event.stopPropagation();
        if (!this.isExpanded) {
            this.toggleExpanded(event);
        }
        this.store.dispatch(new treeActions.CreateTreeNode({
            id: uuid(),
            name: 'New Forecast Sheet',
            parentId: this.folder.id,
            type: 'FC_SHEET',
            ownerName: Utils.getUserName()

        }));
    }

    addTemplate(event) {
        event.stopPropagation();
        this.store.dispatch(new treeActions.CreateTreeNode({
            id: uuid(),
            name: 'New Model Template',
            parentId: this.folder.id,
            type: 'MODELTEMPLATE',
            ownerName: Utils.getUserName()

        }));
    }

    // TODO: Uncomment when deletion or trashing of nodes is fully implemented,
    //       with nodes being de-selected and child components of nodes being destroyed
    // @HostListener('document:keydown.delete', ['$event'])
    // @HostListener('document:keydown.backspace', ['$event'])
    // onDeletePressed() {
    //     // TODO: This should be trash with a confirmation, but for now lets make it easy for devs to clean up :)
    //     if (this.isSelected) {
    //         this.store.dispatch(new treeActions.DeleteTreeNode(this.folder));
    //     }
    // }

    createNode(event) {
        if (!this.isExpanded) {
            this.toggleExpanded(event);
        }
    }


    toggleExpanded(event) {
        event.stopPropagation();
        let actions: any[] = [new libraryActions.SetNodeProperties({
            id: this.folder.id,
            treeNodeProperties: {
                isExpanded: !this.isExpanded
            }
        })];
        if (!this.isExpanded) {
            actions = [...actions, new libraryActions.FolderAccessed(this.folder)];
        }
        this.store.dispatch(actions);
    }

    openFolderRenameMode() {
        if (this.isSelected) {
            this.isSelected = false;
        }
        this.store.dispatch(new libraryActions.RenameFolderClicked(this.folder));
    }

    renameFolder(newName: string) {
        if (newName !== this.folder.name) {
            this.store.dispatch(new libraryActions.RenameFolderCommitted(
                {
                    nodeId: this.folder.id,
                    newName: newName
                }
            ));
            this.store.dispatch(new layoutActions.InvalidateEditorTabNames());
        }
        this.store.dispatch(new libraryActions.RenameFolderEscaped());
    }

    onCancelRename() {
        this.store.dispatch(new libraryActions.RenameFolderEscaped());
    }

    @HostListener('document:keydown', ['$event'])
    onPasteNode(event: KeyboardEvent) {
        if (event.ctrlKey && event.key === 'v' && this.isSelected && this.clipboardHasData && !$('input').is(':focus') && !$('textarea').is(':focus')) {
            this.store.dispatch(new clipboardActions.NodesPasted(this.folder.id));
        }
    }
}

