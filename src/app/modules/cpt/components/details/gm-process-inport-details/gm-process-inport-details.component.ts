import { Component, OnInit, Input, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { Store } from '@ngxs/store';
import { ALL_PARAM_TYPES } from '@cpt/capacity-planning-simulation-types';
import * as gmProcessInportDetailsActions from '@app/modules/cpt/state/gm-process-inport-details.actions';
import * as moment from 'moment';

@Component({
    selector: 'app-gm-process-inport-details',
    templateUrl: './gm-process-inport-details.component.html',
    styleUrls: ['../../common.css', './gm-process-inport-details.component.css']
})
export class GmProcessInportDetailsComponent implements OnInit, AfterViewInit {
    @Input() selected;
    default: boolean;
    @ViewChild('processInportElement', { static: false }) processInportElement: ElementRef;

    get processInport() {
        return this.selected.object;
    }

    get paramTypes() {
        if (this.processInport.requiredTypes.length === 0) {
            return ALL_PARAM_TYPES;
        } else {
            // don't display PE aspect TAG type
            return this.processInport.requiredTypes.filter(t => t !== 'TAG');


        }
    }

    get selectedParamType() {
        switch (this.processInport.param && this.processInport.param.type) {
            case 'NUMBER':
            case 'BOOLEAN':
            case 'DATE':
            case 'STRING':
                return this.processInport.param.type;
            case 'ASPECT':
                return this.processInport.param.value && this.processInport.param.value.type;
        }
    }

    get paramValue() {
        switch (this.processInport.param && this.processInport.param.type) {
            case 'NUMBER':
            case 'BOOLEAN':
            case 'STRING':
            case 'ASPECT':
                return this.processInport.param.value;
            case 'DATE':
                return moment(this.processInport.param.value).format('YYYY-MM');
        }
    }

    get defaultParamValue() {
        if ((this.processInport.defaultSelected || this.default) && this.processInport.defaultParam) {
            switch (this.processInport.defaultParam.type) {
                case 'NUMBER':
                case 'BOOLEAN':
                case 'DATE':
                case 'STRING':
                    return JSON.stringify(this.processInport.defaultParam.value);
                case 'ASPECT':
                    return JSON.stringify(this.processInport.defaultParam.value.name);
            }
        }
    }

    get useDefault() {
        return this.processInport.defaultSelected || this.default;
    }

    get readonly() {
        return !!this.selected.releaseNr;
    }

    constructor(private store: Store) { }

    ngOnInit() {
        this.default = this.processInport.defaultParam && this.processInport.param === undefined && this.processInport.defaultSelected === undefined;
    }

    ngAfterViewInit() {
        if (this.selected.eventType && this.selected.eventType === 'dblclick' && this.processInportElement) {
            setTimeout(() => { this.processInportElement.nativeElement.select(); }, 0);
        }
    }

    handleDefaultParamUseCheckboxChange(event) {
        this.default = event.target.checked;
        this.store.dispatch(new gmProcessInportDetailsActions.DefaultParamChanged({
            graphModelId: this.processInport.graphModel.id,
            processInportId: this.processInport.id,
            paramType: undefined,
            defaultParam: this.processInport.defaultParam,
            defaultSelected: event.target.checked
        }));
    }

    handleParamTypeChange(event) {
        this.store.dispatch(new gmProcessInportDetailsActions.ParamTypeChanged({
            graphModelId: this.processInport.graphModel.id,
            processInportId: this.processInport.id,
            paramType: event.target.value,
            defaultParam: this.processInport.defaultParam
        }));
    }

    private eventToValue(event) {
        switch (this.processInport.param.type) {
            case 'NUMBER':
                return Number(event.target.value);
            case 'BOOLEAN':
                return event.target.checked;
            case 'STRING':
                return event.target.value;
            case 'DATE':
                console.log(moment(event.target.value, 'YYYY-MM').toDate());
                return moment(event.target.value, 'YYYY-MM').toDate();
            case 'ASPECT':
                return event;
        }
    }

    saveParamValue(event) {
        this.store.dispatch(new gmProcessInportDetailsActions.ParamValueChanged({
            graphModelId: this.processInport.graphModel.id,
            processInportId: this.processInport.id,
            paramValue: this.eventToValue(event)
        }));
    }
}
