import { Component, Input, Output, EventEmitter, HostBinding, ViewChild, ViewContainerRef, ComponentFactoryResolver, HostListener } from '@angular/core';
import { VariableType } from '@cpt/capacity-planning-projection/lib';
import { TimeSegmentMethod, TimeSegmentBasic } from '@cpt/capacity-planning-projection/lib/timesegment';
import { ForecastFrame } from '../../../../../interfaces/forecast-frame';
import { ForecastVariable } from '../../../../../interfaces/forecast-variable';
import { TimesegmentModel } from '../../../../../interfaces/timesegment';
import { DistributionSourceMethod } from '@cpt/capacity-planning-projection/lib/distribution';
/**
* Displays formatted frame value of a projection
* For Real or Integer Variable types:
*   - Clicking selects (by notifying parent forecast-app/spreadsheet-entry)
*   - Double-clicking de-selects and opens the frame-editor
*/
@Component({
    selector: 'frame-cell',
    templateUrl: './frame.cell.component.html',
    styleUrls: ['./frame.cell.component.css'],
})
export class FrameCellComponent {
    @Input('variable') variable: ForecastVariable;
    @Input('frame') frame: ForecastFrame;
    @Input('variableList') variableList;
    @Output('frameCellClicked') frameCellClicked = new EventEmitter();
    @Output('frameCellDoubleClicked') frameCellDoubleClicked = new EventEmitter();
    @Output('onUpsertActualValue') onUpsertActualValue = new EventEmitter();
    @Output('onUpsertTimesegment') onUpsertTimesegment = new EventEmitter();
    @HostBinding('class.selected') @Input('selected') selected = true;
    @ViewChild('indicatorContainer', { read: ViewContainerRef }) indicatorContainer;
    @Output('onShowEdit') onShowEdit = new EventEmitter();

    showEdit = false;
    fwdKeyEvent = undefined;
    editingActual = false;
    timesegmentChangeset;

    ableToOpen = true;

    @HostBinding('class.is-past')
    get isPast(): boolean {
        return this.frame.isPast;
    }
    set isPast(v) { }

    @HostBinding('class.has-actual')
    get hasActual(): boolean {
        return this.frame.actualValue !== undefined;
    }
    set hasActual(v) { }

    @HostBinding('class.is-clickable')
    get isClickable() {
        return this.variableType === 'Real' || this.variableType === 'Integer' || this.variableType === 'Breakdown';
    }
    set isClickable(v) { }

    @HostBinding('class.highlight-error')
    get highlightError(): boolean {
        return this.frame.highlightError;
    }
    isBreakdown() {
        return this.variableType === 'Breakdown';
    }
    get timeSegment(): TimesegmentModel {
        return this.frame.timeSegment;
    }
    set timeSegment(v) { }

    get variableType(): string {
        const varType = this.variable.content.variableType;

        if (varType === VariableType.Real) {
            return 'Real';
        }
        if (varType === VariableType.Integer) {
            return 'Integer';
        }
        if (varType === VariableType.Breakdown) {
            return 'Breakdown';
        }
    }

    @HostBinding('class.is-warning')
    get isWarning(): boolean {
        return this.variableType === 'Breakdown' && parseFloat(this.frame.projectedValue.toFixed(13)) !== 1;
    }

    /**
    * emits the data of this frame when it is clicked on
    */
    click() {
        if (this.isClickable && !this.showEdit) {
            this.frameCellClicked.emit(this.frame);
        }
    }

    /**
     * Opens up the frame cell's editor (if it is a clickable frame cell).
     * If there are no predefined timesegments for this frame's date, it creates a new
     * timesegment with default values
     */
    doubleClick(fwdKeyEvent?) {
        if (this.isPast && fwdKeyEvent !== undefined && fwdKeyEvent.key === '=') {
            return;
        }
        this.frameCellDoubleClicked.emit();
        if (this.ableToOpen && this.variableType !== 'Breakdown') {
            this.selected = false;
            if (!this.isClickable) {
                return;
            }

            if (this.isPast) {
                this.editingActual = true;
            }

            this.timesegmentChangeset = Object.assign({}, this.timeSegment || new TimeSegmentBasic(this.frame.date));

            if (this.timesegmentChangeset.method === 'BASIC') {
                this.timesegmentChangeset.value = this.frame.projectedValue;
            }

            this.showEdit = true;
            this.fwdKeyEvent = fwdKeyEvent;
            this.onShowEdit.emit(this.showEdit);
        }
    }

    /**
     * Emits am upsert event for the changed timesegment
     * @param timeSemgentChanges the data for the timesegment that is to be saved
     */
    saveTimesegment(timeSemgentChanges) {
        this.onUpsertTimesegment.emit(timeSemgentChanges);
    }

    /**
     * Emits an upsert event for the changed actual value
     * @param actualValue the actual value to be saved for this frame's date
     */
    saveActual(actualValue: number) {
        this.onUpsertActualValue.emit(actualValue);
    }

    onCloseEditor() {
        this.showEdit = false;
        this.onShowEdit.emit(this.showEdit);
    }

    /**
     * Gets the type of time segment indicator that represents the characteristics of the time segment of the frame:
     * - 'basic' if of TimeSegment method 'Basic'
     * - 'expression' if of TimeSegment method 'Expression'
     * - '-g' if it has a growth
     * - '-nog' if it has no growth
     * - '-d' if it has a distribution
     * - 'nod' if it has no distribution
     * @returns the type of time segment indicator for this frame. If there is nor time segment defined for
     * this frame date, nothing is returned
     */
    get indicatorType(): string {
        if (this.frame.timeSegment === undefined || this.frame.timeSegment.date !== this.frame.date) {
            return;
        }
        const method = this.frame.timeSegment.method;
        if (method === TimeSegmentMethod.Basic) {
            const timeSeg = this.frame.timeSegment as TimesegmentModel;
            const growth = timeSeg.growth > 0 ? 'g' : 'nog';
            let distribution = 'nod';
            if (timeSeg.distribution) {
                if (timeSeg.distribution.method !== DistributionSourceMethod.Auto) {
                    distribution = 'd';
                }
            }
            return 'basic-' + growth + '-' + distribution;
        }
        if (method === TimeSegmentMethod.Expression) {
            return 'expression';
        }
    }

    /**
     * hides the editor if escape button is pressed
     */
    onEscape() {
        this.showEdit = false;
        this.onShowEdit.emit(this.showEdit);
    }

    toolTipAction() {
        if (this.highlightError) {
            return this.frame.errorMsg;
        } else {
            return '';
        }
    }
}
