import { Component, Input, OnInit } from '@angular/core';
import { HistoryItem } from '@app/modules/cpt/models/history-item';
import { Store } from '@ngxs/store';
import * as historyAction from '@app/modules/cpt/state/history.actions';

@Component({
    selector: 'app-history-item',
    templateUrl: './history-item.component.html',
    styleUrls: ['./history-item.component.css']
})
export class HistoryItemComponent implements OnInit {
    @Input() historyItem: HistoryItem;
    @Input() displayFields: string[];

    hovering = false;
    fullOutput: string;

    constructor(private store: Store) { }

    isVersion(): boolean {
        return !this.historyItem.release;
    }


    isReleasableVersion(): boolean {
        return this.isVersion() && this.historyItem.version && this.historyItem.version.releasable;
    }

    isRelease(): boolean {
        return !!this.historyItem.release;
    }

    isEditableNode(): boolean {
        return this.historyItem.element.type === 'GRAPH_MODEL' || this.historyItem.element.type === 'FC_SHEET';
    }

    isGraphModel(): boolean {
        return this.historyItem.element.type === 'GRAPH_MODEL';
    }

    canModify(): boolean {
        return this.historyItem.currentUserAccessPermissions.includes('MODIFY');
    }

    ngOnInit() {
        this.fullOutput = this.historyItem.time + '\t \'' + this.historyItem.user + '\' - ' + this.historyItem.action;
        if (this.historyItem.release && this.historyItem.release.description) {
            this.fullOutput += ' - ' + this.historyItem.release.description;
        }
    }

    onMouseEnter() {
        this.hovering = true;
    }

    onMouseLeave() {
        this.hovering = false;
    }

    editVersion() {
        this.store.dispatch(new historyAction.EditVersionClicked({ version: this.historyItem.version, objectName: this.historyItem.element.nodeName }))

    }

    editRelease() {
        this.store.dispatch(new historyAction.EditReleaseClicked({ release: this.historyItem.release, objectName: this.historyItem.element.nodeName }))
    }

    isActiveRelease(): boolean {
        if (this.historyItem.element.type === 'SIMULATION' || this.historyItem.element.type === 'PROCESS') {
            return this.isRelease() && this.historyItem.release.id && this.historyItem.element.versionId === this.historyItem.release.id;
        }
        return false;

    }
}
