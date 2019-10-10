import { Component, ElementRef, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { Store } from '@ngxs/store';
import * as graphControlBarActions from '@system-models/state/graph-control-bar.actions';

@Component({
    selector: 'app-gm-manual-save',
    templateUrl: './gm-manual-save.component.html',
    styleUrls: ['./gm-manual-save.component.css']
})
export class GmManualSaveComponent {
    showCommentInput = false;
    @Input() graphModel;
    @ViewChild('commentInput') commentInputElement: ElementRef;
    @Output('toggleHelpBox') toggleHelpBox = new EventEmitter();


    constructor(private store: Store) { }

    setCommentInputVisible() {
        if (!this.showCommentInput) {
            this.showCommentInput = true;
            this.toggleHelpBox.emit();
            setTimeout(() => {
                this.commentInputElement.nativeElement.focus();
            });
        }
    }

    saveComment(event) {
        const comment = event.target.value;
        this.showCommentInput = false;
        this.toggleHelpBox.emit();
        this.store.dispatch(new graphControlBarActions.GraphModelVersionCommentCommitted(
            {
                id: this.graphModel.id,
                comment: comment
            }));
    }
}
