import { Component, Output, EventEmitter, Input, HostListener, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { TreeNode } from '@app/modules/cpt/interfaces/tree-node';
import * as libraryActions from '@app/modules/cpt/state/library.actions';
import * as clipboardActions from '@app/modules/cpt/state/clipboard.actions';
import * as treeActions from '@app/modules/cpt/state/tree.actions';
import { Store, Actions, ofActionSuccessful, Select } from '@ngxs/store';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { PermissionsObject } from '@app/modules/cpt/interfaces/permissions';
import { TreeState } from '@app/modules/cpt/state/tree.state';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import { Utils } from '@app/modules/cpt/lib/utils';


@Component({
    selector: 'app-library-graph-model-menu',
    templateUrl: './library-graph-model-popup-menu.component.html',
    styleUrls: ['./library-graph-model-popup-menu.component.css']
})

export class LibraryGraphModelPopupMenuComponent implements OnInit, OnDestroy {
    @Input() graphModel: TreeNode;
    @Output() renameGraphModel = new EventEmitter();
    @Output() closePopup = new EventEmitter();
    @Output() openModel = new EventEmitter();
    @Select(TreeState.nodesOfType('MODEL')) graphModelNodes$: Observable<TreeNode[]>;

    modifyPermissionsObj: PermissionsObject;
    deletePermissionsObj: PermissionsObject;

    constructor(private _el: ElementRef, private store: Store, private actions$: Actions) {
        this.actions$.pipe(ofActionSuccessful(libraryActions.GraphModelSendToTrashClicked), untilDestroyed(this)).subscribe(({ trashNode }) => {
            this.store.dispatch(new treeActions.SendGraphModelToTrash(trashNode)).pipe(catchError(e => of(''))).subscribe();
        });
    }


    ngOnInit() {
        this.modifyPermissionsObj = { permissions: 'MODIFY', accessObject: this.graphModel };
        this.deletePermissionsObj = { permissions: 'DELETE', accessObject: this.graphModel };
    }

    ngOnDestroy() { }

    @HostListener('document:click', ['$event', '$event.target'])
    clickOutside(event: MouseEvent, targetElement: HTMLElement): void {
        const clickedInside = this._el.nativeElement.contains(targetElement) || targetElement.closest('#options-' + this.graphModel.id);
        if (!clickedInside) {
            this.closePopup.emit();
        }
    }

    onOpenModel() {
        this.openModel.emit();
        this.closePopup.emit();
    }

    onRenameModel() {
        this.renameGraphModel.emit();
        this.closePopup.emit();
    }

    onCopyLink() {
        Utils.copyNodeUrlToClipboard(this.graphModel.id);
        this.closePopup.emit();
    }

    onMoveModel() {
        const actions: any[] = [new libraryActions.GraphModelClicked(this.graphModel), new clipboardActions.NodesCut()];
        this.store.dispatch(actions);
        this.closePopup.emit();
    }

    onCopyModel() {
        const actions: any[] = [new libraryActions.GraphModelClicked(this.graphModel), new clipboardActions.NodesCopied()];
        this.store.dispatch(actions);
        this.closePopup.emit();
    }

    onTrashModel() {
        this.store.dispatch(new libraryActions.GraphModelSendToTrashClicked(this.graphModel));
        this.closePopup.emit();
    }

    onNewSimulation() {
        this.store.dispatch(new treeActions.CreateTreeNode({
            id: uuid(),
            name: this.graphModel.name + ' Simulation',
            parentId: this.graphModel.parentId,
            type: 'SIMULATION',
            ownerName: Utils.getUserName(),
            ref: this.graphModel.id
        }));
        this.closePopup.emit();
    }
}
