import { Component, HostBinding, Output, EventEmitter, Input } from '@angular/core';
import { VariableType } from '@cpt/capacity-planning-projection/lib';
import { ForecastFrame } from '@app/core_module/interfaces/forecast-frame';
import { ForecastSubFrame } from '@app/core_module/interfaces/forecast-sub-frame';
import { ForecastVariable } from '@app/core_module/interfaces/forecast-variable';

/**
* Displays formatted subframe value
*   - Uses shared formatValue utility function to format values based on variableType
* Only for subframes for variable type Breakdown:
*   - Clicking selects (by notifying parent forecast-app/spreadsheet)
*   - Double-clicking de-selects and sets subframe into edit mode
* In edit mode, whole cell turns into an input
*   - escape reverts value
*   - enter emits saveSubframe event with the updated value
*/
@Component({
    selector: 'subframe-cell',
    templateUrl: './subframe.cell.component.html',
    styleUrls: ['./subframe.cell.component.css']
})
export class SubframeCellComponent {
    @Output('subframeCellClicked') subframeCellClicked = new EventEmitter();
    @Output('subframeCellDoubleClicked') subframeCellDoubleClicked = new EventEmitter();
    @Output('onUpsertSubframe') onUpsertSubframe = new EventEmitter();
    @Output('subframeEnterEdit') subframeEnterEdit = new EventEmitter();
    @Output('subframeLeaveEdit') subframeLeaveEdit = new EventEmitter();

    // @HostBinding('class.is-past') isPast: Boolean = false;
    @HostBinding('class.has-actual') get hasActual() { return this.frame.hasActual; }
    @HostBinding('class.actual-is-gt-projected') get actualIsGtProjected() { return this.frame.actualValue > this.frame.projectedValue; }
    @Input('frame') frame: ForecastFrame;
    @Input('isFrameEditorOpen') isFrameEditorOpen: boolean;
    @Input('subframe') subframe: ForecastSubFrame;
    @Input('variable') variable: ForecastVariable;
    @Input('hasTimesegment') hasTimesegment;
    @Input('selected') selected;

    showEdit = false;
    fwdKeyEvent = undefined;

    /**
     * emits an event when subframe is clicked
     */
    click() {
        if (this.isClickable && !this.isFrameEditorOpen) {
            this.subframeCellClicked.emit(this.subframe);
        }
    }

    get value() {
        return this.subframe.value;
    }

    get variableType(): string {
        const varType = this.variable.content.variableType;

        // FIXME: Maybe utility function should take enum value for var type instead of string?
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

    @HostBinding('class.is-clickable')
    get isClickable(): boolean {
        return this.variableType === 'Breakdown';
    }

    doubleClick(fwdKeyEvent) {
        if (!this.isClickable) {
            return;
        }
        if (!this.isFrameEditorOpen) {
            this.showEdit = true;
            this.fwdKeyEvent = fwdKeyEvent;
            this.subframeCellDoubleClicked.emit();
            this.subframeEnterEdit.emit();
        }
    }

    // TODO: implement saving of subframe changes
    saveSubframe(newValue) {
        this.onUpsertSubframe.emit(newValue);
        this.showEdit = false;
        this.subframeLeaveEdit.emit();
    }

    onEscape() {
        this.showEdit = false;
        this.subframeLeaveEdit.emit();
    }
}
