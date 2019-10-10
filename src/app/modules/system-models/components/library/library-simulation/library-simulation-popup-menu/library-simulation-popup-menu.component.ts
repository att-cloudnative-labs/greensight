import { Component, Output, EventEmitter, Input, HostListener, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { TreeNode } from '@app/core_module/interfaces/tree-node';
import * as libraryActions from '@system-models/state/library.actions';
import * as treeActions from '@system-models/state/tree.actions';
import { Store, Actions, ofActionSuccessful } from '@ngxs/store';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { PermissionsObject } from '@app/shared/interfaces/permissions';
import * as clipboardActions from '@system-models/state/clipboard.actions';

@Component({
    selector: 'app-library-simulation-menu',
    templateUrl: './library-simulation-popup-menu.component.html',
    styleUrls: ['./library-simulation-popup-menu.component.css']
})
export class LibrarySimulationPopupMenuComponent implements OnInit, OnDestroy {
    @Input() simulation: TreeNode;
    @Output() renameSimulation = new EventEmitter();
    @Output() closePopup = new EventEmitter();
    @Output() openModel = new EventEmitter();

    menuPermissionsObj: PermissionsObject;
    trashPermissionsObj: PermissionsObject;

    constructor(private _el: ElementRef, private store: Store, private actions$: Actions) {
        this.actions$.pipe(ofActionSuccessful(libraryActions.SimulationSendToTrashClicked), untilDestroyed(this)).subscribe(({ trashNode }) => {
            this.store.dispatch(new treeActions.SendSimulationToTrash(trashNode));
        });
    }

    ngOnInit() {
        this.menuPermissionsObj = { permissions: 'MODIFY', accessObject: this.simulation };
        this.trashPermissionsObj = { permissions: 'DELETE', accessObject: this.simulation };
    }

    ngOnDestroy() { }

    @HostListener('document:click', ['$event', '$event.target'])
    clickOutside(event: MouseEvent, targetElement: HTMLElement): void {
        const clickedInside = this._el.nativeElement.contains(targetElement) || targetElement.closest('#options-' + this.simulation.id);
        if (!clickedInside) {
            this.closePopup.emit();
        }
    }

    onOpenModel() {
        this.openModel.emit();
        this.closePopup.emit();
    }

    onRenameModel() {
        this.renameSimulation.emit();
        this.closePopup.emit();
    }

    onDuplicateModel() {
    }

    onMoveSimConfig() {
        const actions: any[] = [new libraryActions.SimulationClicked(this.simulation), new clipboardActions.NodesCut()];
        this.store.dispatch(actions);
        this.closePopup.emit();
    }

    onCopySimConfig() {
        const actions: any[] = [new libraryActions.SimulationClicked(this.simulation), new clipboardActions.NodesCopied()];
        this.store.dispatch(actions);
        this.closePopup.emit();
    }

    onTrashModel() {
        this.store.dispatch(new libraryActions.SimulationSendToTrashClicked(this.simulation));
        this.closePopup.emit();
    }
}
