import { Component, Output, EventEmitter, Input, HostListener, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { Store, Actions, ofActionSuccessful, Select } from '@ngxs/store';
import { Modal } from 'ngx-modialog/plugins/bootstrap';
import { TreeNode } from '@app/core_module/interfaces/tree-node';
import * as treeActions from '@system-models/state/tree.actions';
import { Utils } from '@app/utils_module/utils';
import { v4 as uuid } from 'uuid';
import * as libraryActions from '@system-models/state/library.actions';
import * as clipboardActions from '@system-models/state/clipboard.actions';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { PermissionsObject } from '@app/shared/interfaces/permissions';
import { ClipboardState, ClipboardStateModel } from '@system-models/state/clipboard.state';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-library-folder-popup-menu',
    templateUrl: './library-folder-popup-menu.component.html',
    styleUrls: ['./library-folder-popup-menu.component.css']
})
export class LibraryFolderPopupMenuComponent implements OnDestroy, OnInit {
    @Input() folder: TreeNode;
    @Output() renameFolder = new EventEmitter();
    @Output() closePopup = new EventEmitter();
    @Output() createNode = new EventEmitter();
    @Select(ClipboardState.clipboardData) clipboard$: Observable<ClipboardStateModel>;
    createPermissionsObj: PermissionsObject;
    modifyPermissionsObj: PermissionsObject;
    deletePermissionsObj: PermissionsObject;
    hasClipboard: boolean;

    constructor(private store: Store,
        private _el: ElementRef,
        private modal: Modal, private actions$: Actions) {
        this.actions$.pipe(ofActionSuccessful(libraryActions.FolderSendToTrashClicked), untilDestroyed(this)).subscribe(({ trashNode }) => {
            this.store.dispatch(new treeActions.SendFolderToTrash(trashNode));
        });
    }

    ngOnInit() {
        this.createPermissionsObj = { permissions: 'CREATE', accessObject: this.folder };
        this.modifyPermissionsObj = { permissions: 'MODIFY', accessObject: this.folder };
        this.deletePermissionsObj = { permissions: 'DELETE', accessObject: this.folder };

        // check if there is a graph model in clipboard and enable pasting
        this.clipboard$.subscribe(clipboard => {
            this.hasClipboard = (clipboard.selections.length !== 0 && clipboard.selections[0].type === 'TreeNode');
        });
    }

    ngOnDestroy() { }

    @HostListener('document:click', ['$event', '$event.target'])
    clickOutside(event: MouseEvent, targetElement: HTMLElement): void {
        const clickedInside = this._el.nativeElement.contains(targetElement) || targetElement.closest('#options-' + this.folder.id);
        if (!clickedInside) {
            this.closePopup.emit();
        }
    }

    onNewModel(event) {
        this.createNode.emit(event);
        this.store.dispatch(new treeActions.CreateTreeNode({
            id: uuid(),
            name: 'New Model',
            parentId: this.folder.id,
            type: 'MODEL',
            ownerName: Utils.getUserName()
        }));
        this.closePopup.emit();
    }

    onNewTemplate() {
        this.store.dispatch(new treeActions.CreateTreeNode({
            id: uuid(),
            name: 'New Model Template',
            parentId: this.folder.id,
            type: 'MODELTEMPLATE',
            ownerName: Utils.getUserName()
        }));
        this.closePopup.emit();
    }

    onRename() {
        this.renameFolder.emit();
        this.closePopup.emit();
    }

    onDuplicate() {
        this.store.dispatch(new treeActions.DuplicateTreeNode(this.folder));
        this.closePopup.emit();
    }

    onMakePrivate() {
        if (this.folder.accessControl !== 'PRIVATE') {
            const updatedFolder = Object.assign({}, this.folder);
            updatedFolder.accessControl = 'PRIVATE';
            ++updatedFolder.version;
            this.store.dispatch(new treeActions.UpdateTreeNode(updatedFolder));
            this.closePopup.emit();
        }
    }

    onMakePublic() {
        if (this.folder.accessControl === 'PRIVATE') {
            const dialog =
                this.modal
                    .confirm()
                    .title('Warning')
                    .body(`Once a folder is public, anyone can reference or copy its content.
                    Even if you decide to change the access back to "Private" later on,
                    anyone who copies or references specific model versions while the folder is public
                    will continue to have access to them. Are you sure you want to make this folder public?`)
                    .okBtn('Make public').okBtnClass('btn btn-primary')
                    .cancelBtn('Cancel')
                    .open();
            dialog.result.then(promise => {
                const updatedFolder = Object.assign({}, this.folder);
                updatedFolder.accessControl = 'PUBLIC_READ_ONLY';
                ++updatedFolder.version;
                this.store.dispatch(new treeActions.UpdateTreeNode(updatedFolder));
                this.closePopup.emit();
            });
        }
    }

    onTrashFolder() {
        this.store.dispatch(new libraryActions.FolderSendToTrashClicked(this.folder));
        this.closePopup.emit();
    }

    onPasteModel() {
        this.store.dispatch(new clipboardActions.NodesPasted(this.folder.id));
        this.closePopup.emit();
    }
}
