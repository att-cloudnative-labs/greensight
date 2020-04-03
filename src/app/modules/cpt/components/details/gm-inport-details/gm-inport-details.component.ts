import { Component, OnInit, Input, HostBinding, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Store } from '@ngxs/store';
import { ALL_PARAM_TYPES } from '@cpt/capacity-planning-simulation-types';
import * as gmInportDetailsActions from '@app/modules/cpt/state/gm-inport-details.actions';
import * as moment from 'moment';


@Component({
    selector: 'app-gm-inport-details',
    templateUrl: './gm-inport-details.component.html',
    styleUrls: ['../../common.css', './gm-inport-details.component.css']
})
export class GmInportDetailsComponent implements OnInit, AfterViewInit {
    @Input() selected;
    @HostBinding('class') breakpoint;
    @ViewChild('inportElement', { static: false }) inportElement: ElementRef;

    requiredTypeOptions = ALL_PARAM_TYPES;
    defaultTypes: string[] = [];

    get inport() {
        return this.selected.object;
    }

    get readonly() {
        return !!this.selected.releaseNr;
    }

    constructor(private store: Store) { }

    ngOnInit() {
        if (this.inport.requiredTypes.length === 0) {
            this.defaultTypes = this.requiredTypeOptions;
        } else {
            this.defaultTypes = this.inport.requiredTypes;
        }
    }

    ngAfterViewInit() {
        if (this.selected.eventType && this.selected.eventType === 'dblclick') {
            setTimeout(() => { this.inportElement.nativeElement.select(); }, 0);
        }
    }

    get defaultValue() {
        switch (this.inport.defaultParam && this.inport.defaultParam.type) {
            case 'NUMBER':
            case 'BOOLEAN':
            case 'STRING':
            case 'ASPECT':
                return this.inport.defaultParam.value;
            case 'DATE':
                return moment(this.inport.defaultParam.value).format('YYYY-MM');
        }
    }
    handleDefaultParamTypeChange(event) {
        this.inport.defaultParam = { type: undefined, value: undefined };
        this.store.dispatch(new gmInportDetailsActions.DefaultParamTypeChanged({
            graphModelId: this.inport.graphModel.id,
            inportId: this.inport.id,
            defaultType: event.target.value
        }));
    }

    get selectedDefaultType() {
        switch (this.inport.defaultParam && this.inport.defaultParam.type) {
            case 'NUMBER':
            case 'BOOLEAN':
            case 'DATE':
            case 'STRING':
                return this.inport.defaultParam.type;
            case 'ASPECT':
                return this.inport.defaultParam.value && this.inport.defaultParam.value.type;
        }
    }

    // TODO: escape key to cancel
    saveName(event) {
        if (event.target.value !== this.inport.name) {
            this.store.dispatch(new gmInportDetailsActions.NameChanged({
                graphModelId: this.selected.context,
                inportId: this.selected.id,
                name: event.target.value
            }));
        }
    }

    handleCheckboxChange(event) {
        this.store.dispatch(new gmInportDetailsActions.RequiredTypeOptionToggled({
            graphModelId: this.selected.context,
            inportId: this.selected.id,
            requiredType: event.target.value,
            checked: event.target.checked
        }));
    }

    // TODO: We need a better way of specifying per-element breakpoints
    checkboxGroupSizeChanged({ width }) {
        if (width > 235) {
            this.breakpoint = 'md';
        } else {
            this.breakpoint = 'sm';
        }
    }

    private eventToValue(event) {
        switch (this.inport.defaultParam.type) {
            case 'NUMBER':
                return Number(event.target.value);
            case 'BOOLEAN':
                return event.target.checked;
            case 'STRING':
                return event.target.value;
            case 'DATE':
                return moment(event.target.value, 'YYYY-MM').toDate();
            case 'ASPECT':
                return event;
        }
    }

    saveDefaultParamValue(event) {
        this.store.dispatch(new gmInportDetailsActions.DefaultParamValueChanged({
            graphModelId: this.selected.context,
            inportId: this.selected.id,
            defaultValue: this.eventToValue(event)
        }));
    }
}
