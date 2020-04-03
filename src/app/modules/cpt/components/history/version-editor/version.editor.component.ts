import { Component, OnInit, OnDestroy, HostBinding, Input } from '@angular/core';
import { Select, Store, ofActionSuccessful, Actions } from '@ngxs/store';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { TreeState } from '@app/modules/cpt/state/tree.state';
import { TreeNode } from '@app/modules/cpt/interfaces/tree-node';
import { HistoryItem } from '@app/modules/cpt/models/history-item';
import { Observable } from 'rxjs';
import * as historyActions from '@app/modules/cpt/state/history.actions';
import { HistoryState } from '@app/modules/cpt/state/history.state';
import { Utils } from '@app/modules/cpt/lib/utils';
import { SelectionState } from '@app/modules/cpt/state/selection.state';
import * as treeActions from '@app/modules/cpt/state/tree.actions';
import * as graphControlBarActions from '@app/modules/cpt/state/graph-control-bar.actions';
import { TrashState } from '@app/modules/cpt/state/trash.state';
import { TreeNodeVersion } from '@app/modules/cpt/interfaces/tree-node-version';
import { TreeService } from '@app/modules/cpt/services/tree.service';
import { GetHistory, UpdateVersionDescription } from '@app/modules/cpt/state/history.actions';

@Component({
    selector: 'app-version-editor',
    templateUrl: './version.editor.component.html',
    styleUrls: ['../../common.css', './version.editor.component.css']
})

export class VersionEditorComponent implements OnInit, OnDestroy {
    @Input() version: TreeNodeVersion;
    @Input() objectName: string;

    description: string;
    date: string;

    constructor(private treeService: TreeService, private store: Store) { }

    ngOnInit() {
        this.description = this.version.description;
        this.date = Utils.convertUTCToUserTimezone(this.version.timestamp);
    }

    saveComment() {
        this.store.dispatch(new UpdateVersionDescription({ version: this.version, description: this.description }));
    }

    ngOnDestroy() { }

    enableUserInput() { }
    disableUserInput() { }

}
