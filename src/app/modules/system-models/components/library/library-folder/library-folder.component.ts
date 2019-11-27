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
import { TreeNode, } from '@app/core_module/interfaces/tree-node';
import { TreeNodeProperties } from '@system-models/state/library.actions';

import { TreeState } from '@system-models/state/tree.state';
import { Select, Store, Actions, ofActionSuccessful } from '@ngxs/store';
import { merge, Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { LibraryState } from '@system-models/state/library.state';
import * as libraryActions from '@system-models/state/library.actions';
import * as treeActions from '@system-models/state/tree.actions';
import * as layoutActions from '@system-models/state/layout.actions';
import { Utils } from '@app/utils_module/utils';

import { LibraryComponent } from '@system-models/components/library/library.component';
import { v4 as uuid } from 'uuid';
import { Popover } from '@app/shared/services/popover.service';
import { PermissionsObject } from '@app/shared/interfaces/permissions';
import { SelectionState, Selection } from '@system-models/state/selection.state';
import * as clipboardActions from '@system-models/state/clipboard.actions';
import { ClipboardState, ClipboardStateModel } from '@system-models/state/clipboard.state';

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
    @ViewChild('folderElement') folderElement;
    @ViewChild('contextMenu') contextMenu: TemplateRef<any>;
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

        this.loadingOrEmpty = merge<string>(of("Loading"), of("Empty").pipe(delay(3000)));

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
        if (this.userRoleId !== 'READ_ONLY') {
            this.store.dispatch(new libraryActions.FolderContextMenuOpened(this.folder));
            this.popover.open({ x: event.x, y: event.y }, this.contextMenu, this.viewContainerRef);
        }
    }

    onMouseEnter() {
        this.hovering = true;
    }

    // only unhighlight the folder if it doesnt have its popup menu open
    onMouseLeave() {
        if (this.showPopup === false) {
            this.hovering = false;
        }
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

    togglePopup(event) {
        event.stopPropagation();
        this.showPopup = !this.showPopup;
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

