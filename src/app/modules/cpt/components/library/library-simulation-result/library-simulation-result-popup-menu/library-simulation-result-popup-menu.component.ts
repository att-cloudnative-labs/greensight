import { Component, Output, EventEmitter, Input, HostListener, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { TreeNode } from '@app/modules/cpt/interfaces/tree-node';
import * as libraryActions from '@app/modules/cpt/state/library.actions';
import * as treeActions from '@app/modules/cpt/state/tree.actions';
import { Store, Actions, ofActionSuccessful } from '@ngxs/store';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { PermissionsObject } from '@app/modules/cpt/interfaces/permissions';
import { Utils } from '@cpt/lib/utils';


@Component({
    selector: 'app-library-simulation-result-menu',
    templateUrl: './library-simulation-result-popup-menu.component.html',
    styleUrls: ['./library-simulation-result-popup-menu.component.css']
})
export class LibrarySimulationResultPopupMenuComponent implements OnInit, OnDestroy {
    @Input() simulationResult: TreeNode;
    @Output() renameSimulationResult = new EventEmitter();
    @Output() closePopup = new EventEmitter();
    @Output() openModel = new EventEmitter();

    menuPermissionsObj: PermissionsObject;
    trashPermissionsObj: PermissionsObject;

    constructor(private _el: ElementRef, private store: Store, private actions$: Actions) {
        this.actions$.pipe(ofActionSuccessful(libraryActions.SimulationResultSendToTrashClicked), untilDestroyed(this)).subscribe(({ trashNode }) => {
            this.store.dispatch(new treeActions.SendSimulationResultToTrash(trashNode));
        });
    }

    ngOnInit() {
        this.menuPermissionsObj = { permissions: 'MODIFY', accessObject: this.simulationResult };
        this.trashPermissionsObj = { permissions: 'DELETE', accessObject: this.simulationResult };
    }

    ngOnDestroy() { }

    @HostListener('document:click', ['$event', '$event.target'])
    clickOutside(event: MouseEvent, targetElement: HTMLElement): void {
        const clickedInside = this._el.nativeElement.contains(targetElement) || targetElement.closest('#options-' + this.simulationResult.id);
        if (!clickedInside) {
            this.closePopup.emit();
        }
    }

    onOpenModel() {
        this.openModel.emit();
        this.closePopup.emit();
    }

    onRenameModel() {
        this.renameSimulationResult.emit();
        this.closePopup.emit();
    }

    onCopyLink() {
        Utils.copyNodeUrlToClipboard(this.simulationResult.id);
        this.closePopup.emit();
    }


    onTrashModel() {
        this.store.dispatch(new libraryActions.SimulationResultSendToTrashClicked(this.simulationResult));
        this.closePopup.emit();
    }
}
