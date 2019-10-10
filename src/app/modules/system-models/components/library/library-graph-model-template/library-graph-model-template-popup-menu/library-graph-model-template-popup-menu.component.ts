import { Component, Output, EventEmitter, Input, HostListener, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { TreeNode } from '@app/core_module/interfaces/tree-node';
import * as libraryActions from '@system-models/state/library.actions';
import * as treeActions from '@system-models/state/tree.actions';
import { Store, Actions, ofActionSuccessful } from '@ngxs/store';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { PermissionsObject } from '@app/shared/interfaces/permissions';

@Component({
    selector: 'app-library-graph-model-template-menu',
    templateUrl: './library-graph-model-template-popup-menu.component.html',
    styleUrls: ['./library-graph-model-template-popup-menu.component.css']
})
export class LibraryGraphModelTemplatePopupMenuComponent implements OnInit, OnDestroy {
    @Input() graphModelTemplate: TreeNode;
    @Output() renameGraphModelTemplate = new EventEmitter();
    @Output() closePopup = new EventEmitter();
    @Output() openModelTemplate = new EventEmitter();

    modifyPermissionsObj: PermissionsObject;
    deletePermissionsObj: PermissionsObject;

    constructor(private _el: ElementRef, private store: Store, private actions$: Actions) {
        this.actions$.pipe(ofActionSuccessful(libraryActions.GraphModelTemplateSendToTrashClicked), untilDestroyed(this)).subscribe(({ trashNode }) => {
            this.store.dispatch(new treeActions.SendGraphModelTemplateToTrash(trashNode));
        });
    }

    ngOnInit() {
        this.modifyPermissionsObj = { permissions: 'MODIFY', accessObject: this.graphModelTemplate };
        this.deletePermissionsObj = { permissions: 'DELETE', accessObject: this.graphModelTemplate };
    }

    ngOnDestroy() { }

    @HostListener('document:click', ['$event', '$event.target'])
    clickOutside(event: MouseEvent, targetElement: HTMLElement): void {
        const clickedInside = this._el.nativeElement.contains(targetElement) || targetElement.closest('#options-' + this.graphModelTemplate.id);
        if (!clickedInside) {
            this.closePopup.emit();
        }
    }

    onOpenModelTemplate() {
        this.openModelTemplate.emit();
        this.closePopup.emit();
    }

    onRenameModelTemplate() {
        this.renameGraphModelTemplate.emit();
        this.closePopup.emit();
    }

    onDuplicateModelTemplate() {
    }

    onMoveModelTemplate() {
    }

    onCopyModelTemplate() {
    }

    onTrashModelTemplate() {
        this.store.dispatch(new libraryActions.GraphModelTemplateSendToTrashClicked(this.graphModelTemplate));
        this.closePopup.emit();
    }
}
