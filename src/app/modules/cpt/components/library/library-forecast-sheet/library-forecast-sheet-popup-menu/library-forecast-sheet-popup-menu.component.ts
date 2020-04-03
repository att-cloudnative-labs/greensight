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


@Component({
    selector: 'app-library-forecast-sheet-popup-menu',
    templateUrl: './library-forecast-sheet-popup-menu.component.html',
    styleUrls: ['./library-forecast-sheet-popup-menu.component.css']
})

export class LibraryForecastSheetPopupMenuComponent implements OnInit, OnDestroy {
    @Input() sheet: TreeNode;
    @Output() renameForecastSheet = new EventEmitter();
    @Output() closePopup = new EventEmitter();
    @Output() openForecastSheet = new EventEmitter();
    @Select(TreeState.nodesOfType('FC_SHEET')) graphModelNodes$: Observable<TreeNode[]>;

    modifyPermissionsObj: PermissionsObject;
    deletePermissionsObj: PermissionsObject;

    constructor(private _el: ElementRef, private store: Store, private actions$: Actions) {
        this.actions$.pipe(ofActionSuccessful(libraryActions.ForecastSheetSendToTrashClicked), untilDestroyed(this)).subscribe(({ trashNode }) => {
            this.store.dispatch(new treeActions.SendForecastSheetToTrash(trashNode)).pipe(catchError(e => of(''))).subscribe();
        });
    }


    ngOnInit() {
        this.modifyPermissionsObj = { permissions: 'MODIFY', accessObject: this.sheet };
        this.deletePermissionsObj = { permissions: 'DELETE', accessObject: this.sheet };
    }

    ngOnDestroy() { }

    @HostListener('document:click', ['$event', '$event.target'])
    clickOutside(event: MouseEvent, targetElement: HTMLElement): void {
        const clickedInside = this._el.nativeElement.contains(targetElement) || targetElement.closest('#options-' + this.sheet.id);
        if (!clickedInside) {
            this.closePopup.emit();
        }
    }

    onOpenForecastSheet() {
        this.openForecastSheet.emit();
        this.closePopup.emit();
    }

    onRenameForecastSheet() {
        this.renameForecastSheet.emit();
        this.closePopup.emit();
    }

    onDuplicateForecastSheet() {
    }

    onMoveForecastSheet() {
        const actions: any[] = [new libraryActions.GraphModelClicked(this.sheet), new clipboardActions.NodesCut()];
        this.store.dispatch(actions);
        this.closePopup.emit();
    }

    onCopyForecastSheet() {
        const actions: any[] = [new libraryActions.GraphModelClicked(this.sheet), new clipboardActions.NodesCopied()];
        this.store.dispatch(actions);
        this.closePopup.emit();
    }

    onTrashForecastSheet() {
        this.store.dispatch(new libraryActions.ForecastSheetSendToTrashClicked(this.sheet));
        this.closePopup.emit();
    }

}
