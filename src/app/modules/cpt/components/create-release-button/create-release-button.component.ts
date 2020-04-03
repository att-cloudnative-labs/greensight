import { Component, ElementRef, ViewChild, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Actions, ofActionDispatched, Store } from '@ngxs/store';
import * as releaseActions from '@cpt/state/release.actions';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { Subject } from 'rxjs';
import { catchError, take } from 'rxjs/operators';

@Component({
    selector: 'app-create-release-button',
    templateUrl: './create-release-button.component.html',
    styleUrls: ['./create-release-button.component.css']
})
export class CreateReleaseButtonComponent implements OnInit, OnDestroy {
    showDescriptionInput = false;
    @Input() treeNodeId: string;
    @Input() treeNodeVersion: number;
    @Input() disabled = false;
    @ViewChild('DescriptionInput', { static: false }) descriptionInputElement: ElementRef;

    saveDescription$: Subject<string>;

    constructor(private store: Store, private actions: Actions) { }

    ngOnInit(): void {
        this.actions.pipe(ofActionDispatched(releaseActions.ReleasePrepared), untilDestroyed(this)).subscribe(({ payload }: releaseActions.ReleasePrepared) => {
            if (payload.nodeId === this.treeNodeId) {
                this.setDescriptionInputVisible();
                this.saveDescription$ = new Subject<string>();
                this.saveDescription$.pipe(untilDestroyed(this), take(1)).subscribe(description => {
                    this.store.dispatch(new releaseActions.ReleaseAddedDescription({ ...payload, description: description }));
                }, error => { });

            }
        });
    }

    ngOnDestroy(): void {
    }

    saveClicked() {
        this.store.dispatch(new releaseActions.ReleaseCreateClicked({ nodeId: this.treeNodeId, version: this.treeNodeVersion }));
    }

    setDescriptionInputVisible() {
        if (!this.showDescriptionInput) {
            this.showDescriptionInput = true;
            setTimeout(() => {
                this.descriptionInputElement.nativeElement.focus();
            });
            this.store.dispatch(new releaseActions.ReleaseDescriptionOpened({ nodeId: this.treeNodeId }));
        }
    }

    discardDescription(event) {
        this.showDescriptionInput = false;
        this.store.dispatch(new releaseActions.ReleaseDescriptionClosed({ nodeId: this.treeNodeId }));
        if (this.saveDescription$) {
            this.saveDescription$.error('discarded');
        }
    }

    saveDescription(event) {
        const description = event.target.value;
        this.showDescriptionInput = false;
        this.store.dispatch(new releaseActions.ReleaseDescriptionClosed({ nodeId: this.treeNodeId }));
        if (this.saveDescription$) {
            this.saveDescription$.next(description);
        }
    }
}
