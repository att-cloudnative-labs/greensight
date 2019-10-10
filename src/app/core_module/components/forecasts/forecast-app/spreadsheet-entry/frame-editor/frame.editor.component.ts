import { Component, Input, EventEmitter, Output, ViewChild, ElementRef, AfterViewInit, HostListener, OnInit, ComponentFactoryResolver } from '@angular/core';
import { EditActualValueComponent } from './edit-actual-value/edit.actual.value.component';
import { TimesegmentEditComponent } from './timesegment-edit/timesegment.edit.component';
import { TimeSegmentMethod } from '@cpt/capacity-planning-projection/lib/timesegment';
import { ExpressionCreatorService } from '../../../../../service/expression-creator.service';
import { Expression } from '@cpt/capacity-planning-projection';
import { Utils } from '../../../../../../utils_module/utils';


@Component({
    selector: 'frame-editor',
    templateUrl: './frame.editor.component.html',
    styleUrls: ['./frame.editor.component.css']
})
export class FrameEditorComponent implements OnInit {
    @Input('frame') frame;
    @Input('isPast') isPast;
    @Input('editingActual') editingActual;
    @Input('timesegment') timesegment;
    @Input('variable') variable;
    @Input('variableList') variableList;
    @Input('fwdKeyEvent') fwdKeyEvent;
    @Output('onSubmitActual') onSubmitActual = new EventEmitter();
    @Output('onSubmitTimesegment') onSubmitTimesegment = new EventEmitter();
    @Output('closeEditor') closeEditor = new EventEmitter();
    value: number;
    originalActualValue;

    @ViewChild(EditActualValueComponent) actualValueComponent;
    @ViewChild(TimesegmentEditComponent) timesegmentEditComponent;

    constructor(private _el: ElementRef, private expressionCreatorService: ExpressionCreatorService) {
    }

    ngOnInit() {
        this.value = this.frame.projectedValue;
        this.originalActualValue = this.frame.actualValue || '';
    }

    /**
     * Emits the appropriate submit event depending on whether it is an actual value or a changed timesegment
     * @param data either an actual value or an object containing the timesegment changes
     */
    onEnterPressed(data: number | Object, keepEditorOpen?: boolean) {
        if (!isNaN(Number(data))) {
            // only save actual if the value has changed
            if (data !== this.originalActualValue) {
                this.onSubmitActual.emit(data);
            }
        } else {
            this.onSubmitTimesegment.emit(data);
        }
        // only close the frame editor if specifically requested the calling function
        if (!keepEditorOpen) {
            this.closeEditor.emit();
        }
    }

    /**
     * listens for an escape button press and emits an event whenever this occurs
     */
    @HostListener('document:keydown.esc', ['$event'])
    onCloseEditor() {
        this.closeEditor.emit();
    }

    /**
     * switches the editor between 'actual' mode and 'projected' mode
     * Requests that changes are persisted to backend after each toggle
     * @param option the name of the type of editor that is to be switched to
     */
    changeEditorType(option: string) {
        if (this.actualValueComponent) {
            this.timesegment.actualValue = this.actualValueComponent.value;
            if (typeof this.timesegment.actualValue === 'string') {
                this.timesegment.actualValue = this.timesegment.actualValue.replace(/,/g, '');
            }
            this.onEnterPressed(this.actualValueComponent.value, true);
            this.editingActual = false;
        } else if (this.timesegmentEditComponent) {
            if (this.timesegmentEditComponent.timesegment.method === TimeSegmentMethod.Basic) {
                if (typeof this.timesegment.value === 'string') {
                    this.timesegment.value = this.timesegment.value.replace(/,/g, '');
                }
            }
            // if the timesegment type is an expression, only allow the editor type to be toggled if the expressions are valid
            if (this.timesegmentEditComponent.timesegment.method === TimeSegmentMethod.Expression) {
                if (!this.timesegmentEditComponent.hasValidExpressions()) {
                    return;
                }
            }
            this.onEnterPressed(this.timesegment, true);
            this.editingActual = true;
        }
    }
}
