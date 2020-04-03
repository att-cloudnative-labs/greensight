import {
    Component, OnInit, ViewChild, ViewContainerRef, Input, Output, EventEmitter,
    ComponentFactoryResolver
} from '@angular/core';
import { GrowthType, TimeSegmentMethod } from '@cpt/capacity-planning-projection/lib/timesegment';
import { ConstantEditComponent } from './editor-types/constant-edit/constant.edit.component';
import { ExpressionEditComponent } from './editor-types/expression-edit/expression.edit.component';
import { DistributionSourceMethod } from '@cpt/capacity-planning-projection/lib/distribution';
import { Utils } from '../../../../../lib/utils';
import { VariableType } from '@cpt/capacity-planning-projection';

@Component({
    selector: 'timesegment-edit',
    templateUrl: './timesegment.edit.component.html',
    styleUrls: ['./timesegment.edit.component.css']
})
export class TimesegmentEditComponent implements OnInit {
    @Input('timesegment') timesegment;
    @Input('variable') variable;
    @Input('variableList') variableList;
    @Input('fwdKeyEvent') fwdKeyEvent;
    @Input('sheetId') sheetId: string;
    @Output('enterPressed') enterPressed = new EventEmitter();
    @Output('closeEditor') closeEditor = new EventEmitter();
    @ViewChild('editContainer', { read: ViewContainerRef, static: true }) editContainer;

    originalTimesegment;
    componentReference: any;

    constructor(private resolver: ComponentFactoryResolver) {

    }

    ngOnInit() {
        this.originalTimesegment = JSON.parse(JSON.stringify(this.timesegment));
        if (this.fwdKeyEvent !== undefined) {
            this.timesegment.method = TimeSegmentMethod.Basic;
            this.timesegment.value = '';
            if (this.timesegment.expression || this.timesegment.expression === '') {
                delete this.timesegment.expression;
            }
        }
        this._loadprojectedEditComponent();
        this.fwdKeyEvent = undefined;
        // keep a copy of the original timesegment
        if (this.originalTimesegment.method === TimeSegmentMethod.Basic && this.originalTimesegment.value !== undefined) {
            if (this.variable.variableType !== VariableType.Integer) {
                this.originalTimesegment.value = parseFloat(parseFloat(this.originalTimesegment.value).toFixed(Utils.getCurrentUserSettings().VARIABLE_DECIMAL));
            } else {
                this.originalTimesegment.value = Math.round(this.originalTimesegment.value);
            }
        }
    }

    /**
     * dynamically loads the appropriate projected editor dropdown depending on the input method of
     * the timesegment
     */
    _loadprojectedEditComponent() {
        if (this.editContainer) {
            this.editContainer.clear();
        }
        let factory;
        const editType = this.timesegment.method;
        if (editType === TimeSegmentMethod.Basic) {
            factory = this.resolver.resolveComponentFactory(ConstantEditComponent);
        } else {
            factory = this.resolver.resolveComponentFactory(ExpressionEditComponent);
        }

        if (factory) {
            const component = this.editContainer.createComponent(factory);
            component.instance.timesegment = this.timesegment;

            component.instance.variable = this.variable;
            component.instance.variableList = this.variableList;

            component.instance.fwdKeyEvent = this.fwdKeyEvent;
            component.instance.sheetId = this.sheetId;

            this.componentReference = component.instance;
            (component.instance).submitChanges.subscribe(timesegmentChanges => {
                // this.enterPressed.emit(timesegmentChanges);
                this.onEnterPressed(timesegmentChanges);
            });
            (component.instance).timeSegTypeChanged.subscribe(timeSegmentType => {
                if (timeSegmentType === TimeSegmentMethod.Expression) {
                    this.timesegment.method = timeSegmentType;

                    if (this.timesegment.value) {
                        this.timesegment.expression = this.timesegment.value;
                        delete this.timesegment.value;
                    }

                    this._loadprojectedEditComponent();
                } else if (timeSegmentType === TimeSegmentMethod.Basic) {
                    this.timesegment.method = timeSegmentType;

                    if (this.timesegment.expression || this.timesegment.expression === '') {
                        this.timesegment.value = parseFloat(this.timesegment.expression);
                        delete this.timesegment.expression;
                    }

                    this._loadprojectedEditComponent();
                }
            });
        }
    }

    /**
     * If the frame is in projected mode and the time segment is invalid, tell the input field to flash
     * red to show the user that the expression needs to br updated before
     */
    indicateInvalidExpression() {
        if (this.componentReference.timesegment.method === TimeSegmentMethod.Expression) {
            this.componentReference.flashInvalid();
        }
    }

    hasValidExpressions() {
        if (this.componentReference.timesegment.method === TimeSegmentMethod.Expression) {
            return this.componentReference.hasValidExpressions();
        }
    }

    onEnterPressed(timeSegment) {
        if (timeSegment.growth && timeSegment.growth !== null) {
            if (timeSegment.method !== TimeSegmentMethod.Expression) {
                timeSegment.growthType = GrowthType.Exponential;
            } else {
                // expressions do not use growth types
                delete timeSegment.growthType;
            }
        } else {
            delete timeSegment.growth;
            delete timeSegment.growthType;
        }

        if (timeSegment.distribution !== undefined) {
            if (timeSegment.distribution.method === 'NONE') {
                delete this.timesegment.distribution;
            } else if (timeSegment.distribution.method === DistributionSourceMethod.Auto) {
                delete timeSegment.distribution.expression;
                delete timeSegment.distribution.staticStdDev;
            } else if (timeSegment.distribution.method === DistributionSourceMethod.Expression) {
                delete timeSegment.distribution.staticStdDev;
            } else if (timeSegment.distribution.method === DistributionSourceMethod.Static) {
                delete timeSegment.distribution.expression;
            }
        }

        // If the projected cell value is left empty
        if ((isNaN(timeSegment.value) || timeSegment.value === '') && timeSegment.method !== TimeSegmentMethod.Expression) {
            if (timeSegment.distribution.method !== DistributionSourceMethod.Auto || timeSegment.growth) {
                this.componentReference.flashInvalid();
                this.componentReference.resetProjectedValue();
                return;
            } else {
                // Can close editor as no changes were made to brand new time segment
                if (!this.originalTimesegment.value && this.originalTimesegment.method !== TimeSegmentMethod.Expression) {
                    this.closeEditor.emit();
                    return;
                }
            }
        }
        // only save timesegment if changes have been made
        if (JSON.stringify(this.originalTimesegment) !== JSON.stringify(timeSegment)) {
            this.enterPressed.emit(timeSegment);
        } else {
            this.closeEditor.emit();
        }
    }
}
