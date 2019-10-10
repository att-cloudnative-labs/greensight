import { Component, Input, OnInit } from '@angular/core';
import { HistoryItem } from '@app/modules/system-models/models/history-item';

@Component({
    selector: 'app-history-item',
    templateUrl: './history-item.component.html',
    styleUrls: ['./history-item.component.css']
})
export class HistoryItemComponent implements OnInit {
    @Input() historyItem: HistoryItem;
    @Input() displayFields: string[];

    fullOutput: string;

    constructor() { }

    ngOnInit() {
        this.fullOutput = this.historyItem.time + '\t \'' + this.historyItem.user + '\' - ' + this.historyItem.action;
    }
}
