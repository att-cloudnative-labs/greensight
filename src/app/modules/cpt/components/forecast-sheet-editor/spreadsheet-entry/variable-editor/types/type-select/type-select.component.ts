import { Component, Input, Output, EventEmitter, OnInit, SimpleChanges, OnChanges } from '@angular/core';
import { VariableType } from '@cpt/capacity-planning-projection/lib';

@Component({
    selector: 'type-select',
    templateUrl: './type-select.component.html',
    styleUrls: ['./type-select.component.css']
})
export class TypeSelectComponent implements OnInit, OnChanges {
    @Input('selected') selected = '';
    @Input('reload') reload;
    @Output('typeChange') onTypeChange = new EventEmitter();

    types = [];
    selectedType = '';

    constructor() { }

    ngOnInit() {
        // Filter out numeric values
        this.types = Object.keys(VariableType).filter((item) => {
            return isNaN(Number(item));
        });

        this.selectedType = this.types.find(x => x.toLowerCase() === this.selected.toLowerCase());
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.reload !== undefined) {
            this.selectedType = this.types.find(x => x.toLowerCase() === this.selected.toLowerCase());
        }
    }

    handleTypeChange() {
        this.onTypeChange.emit(this.selectedType);
    }
}
