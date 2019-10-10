import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Utils } from '@app/utils_module/utils';


@Component({
    selector: 'app-breakdown-editor',
    templateUrl: './breakdown-editor.component.html',
    styleUrls: ['./breakdown-editor.component.css']
})
export class BreakdownEditorComponent implements OnInit {
    public name = '';
    public slices = [];
    private _value = {};
    @Input() aspectType;
    @Input() set value(value) {
        this._value = value;
        this.name = value.name;
        this.slices = Object.keys(value.slices).map(key => {
            return {
                key,
                value: value.slices[key]
            };
        });
    }

    get value() {
        return {
            ...this._value,
            name: this.name,
            slices: this.slices.reduce((slices, slice) => {
                return {
                    ...slices,
                    [slice.key]: slice.value
                };
            }, {})
        };
    }

    @Output() onChange = new EventEmitter();

    constructor() {
    }

    ngOnInit() {
    }

    changeName(event) {
        this.name = event.target.value;
        this.onChange.emit(this.value);
    }

    addSlice() {
        this.slices.push({
            key: '',
            value: 0
        });
        this.onChange.emit(this.value);
    }

    changeSlice(key, slice) {
        this.slices = this.slices.map(original => {
            if (original.key === key) {
                return slice;
            } else {
                return original;
            }
        });
        this.onChange.emit(this.value);
    }

    removeSlice(key) {
        this.slices = this.slices.filter(slice => slice.key !== key);
        this.onChange.emit(this.value);
    }

}
