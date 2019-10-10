import { Component, OnInit, Input, ViewChild, TemplateRef, Output, EventEmitter } from '@angular/core';

type Level = 'expander' | 'line' | 'dot';

@Component({
    selector: 'app-sr-tree-node',
    templateUrl: './sr-tree-node.component.html',
    styleUrls: ['./sr-tree-node.component.css']
})
export class SrTreeNodeComponent implements OnInit {
    @Input() result: any;
    @Input() expanded = false;
    @Input() expandable = false;
    @Input() level = 0;
    @Output() expanderClick: EventEmitter<any> = new EventEmitter();

    @ViewChild('expander') expander: TemplateRef<any>;
    @ViewChild('line') line: TemplateRef<any>;
    @ViewChild('dot') dot: TemplateRef<any>;

    levels: Level[] = [];

    ICONS = {
        'GRAPH_MODEL': 'fa-cube',
        'PROCESS_INPORT': 'fa-long-arrow-alt-right',
        'PROCESS_OUTPORT': 'fa-long-arrow-alt-left',
        'PROCESSING_ELEMENT': 'fa-microchip',
        'BREAKDOWN': 'fa-chart-pie',
        'SLICE': 'fa-chart-line',
        'BROADCAST_VARIABLE': 'fa-wifi',
        'NAMED_VARIABLE': 'fa-angle-double-right'
    };

    constructor() { }

    ngOnInit() {
        this.levels = Array(this.level + 1).fill(0).map((x, i) => {
            if (this.expandable && i === this.level) {
                return 'expander';
            }
            if (i === this.level) {
                return 'dot';
            }
            return 'line';
        });
    }

    handleExpanderClick(event) {
        event.preventDefault();
        this.expanderClick.emit(event);
    }
}
