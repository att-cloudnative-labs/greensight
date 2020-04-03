import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Store } from '@ngxs/store';
import { Utils } from '@cpt/lib/utils';
import {
    UpdateReleaseDescription
} from '@cpt/state/history.actions';
import { ReleaseService } from '@cpt/services/release.service';
import { TreeNodeRelease } from '@cpt/interfaces/tree-node-release';

@Component({
    selector: 'app-release-editor',
    templateUrl: './release.editor.component.html',
    styleUrls: ['../../common.css', './release.editor.component.css']
})

export class ReleaseEditorComponent implements OnInit, OnDestroy {
    @Input() release: TreeNodeRelease;
    @Input() objectName: string;
    @Input() panelId: string;

    description: string;
    releaseCreateDate: string;

    constructor(private releaseService: ReleaseService, private store: Store) { }

    ngOnInit() {
        this.description = this.release.description;
        this.releaseCreateDate = Utils.convertUTCToUserTimezone(this.release.timestamp);
    }

    saveDescription() {
        this.store.dispatch(new UpdateReleaseDescription({ release: this.release, description: this.description }));
    }

    ngOnDestroy() { }

    enableUserInput() { }
    disableUserInput() { }

}
