import {
    Component, Input, Output, EventEmitter, ViewChild, ViewContainerRef,
    ComponentFactoryResolver, ElementRef, HostListener, OnInit
} from '@angular/core';
import { VariableType } from '@cpt/capacity-planning-projection/lib';
import { IntegerTypeComponent } from './types/integer/integer.type.component';
import { BreakdownTypeComponent } from './types/breakdown/breakdown.type.component';
import { RealTypeComponent } from './types/real/real.type.component';
import { ForecastVariable } from '@app/core_module/interfaces/forecast-variable';
import { Unit } from '../../../../../interfaces/unit';
import { TimeSegmentMethod } from '@cpt/capacity-planning-projection/lib/timesegment';
import { ModalDialogService } from '../../../../../service/modal-dialog.service';
import { Modal } from 'ngx-modialog/plugins/bootstrap';
import { ForecastVariableService } from '../../../../../service/variable.service';
import { ForecastAppComponent } from '../../forecast.app.component';


@Component({
    selector: 'variable-editor',
    templateUrl: './variable.editor.component.html',
    styleUrls: ['./variable.editor.component.css']
})
export class VariableEditorComponent implements OnInit {
    @Input('variable') variable: ForecastVariable;
    @Input('allVariables') allVariables: Array<ForecastVariable>;
    @Input('units') units: Array<Unit>;
    @Input('startDate') startDate: string;
    @Input('buttonId') buttonId: string;
    @Output('onDelete') onDelete = new EventEmitter();
    @Output('onSubmit') onSubmit = new EventEmitter();
    @Output('onEscape') onEscape = new EventEmitter();
    @Output('onClose') onClose = new EventEmitter();

    @ViewChild('nameField') nameField: ElementRef;
    @ViewChild('typeContainer', { read: ViewContainerRef }) typeContainer;

    public trigger = false;

    private showingModal = true;

    constructor(private resolver: ComponentFactoryResolver, private _el: ElementRef,
        private modal: ModalDialogService,
        private modalDialog: Modal,
        private variableService: ForecastVariableService,
        private forecastApp: ForecastAppComponent) { }

    ngOnInit() {
        this.showingModal = false;
        this.trigger = false;
        this.generateComponent();
    }

    get type(): string {
        return this.variable.content.variableType;
    }

    /**
    * Emits an escape event if a click event occurs outside of the variable editor
    */
    @HostListener('document:mousedown', ['$event', '$event.target'])
    clickOutside(event: MouseEvent, targetElement: HTMLElement): void {
        if (this.showingModal || !targetElement || targetElement.classList.contains(this.buttonId) || targetElement.closest('.subVar-delete')) {
            return;
        }
        const clickedInside = this._el.nativeElement.contains(targetElement)
            || targetElement.closest('#subvariableInput');
        if (!clickedInside) {
            this.onClose.emit();
        }
    }

    @HostListener('window:keydown', ['$event'])
    onKeyDown($event: KeyboardEvent) {
        // 'Z' key event is capital Z not lowercase z, don't change below $event.key to z.
        if (($event.ctrlKey || $event.metaKey) && $event.shiftKey && $event.key === 'Z') {
            this.onClose.emit();
        } else if (($event.ctrlKey || $event.metaKey) && $event.key === 'z') {
            this.onClose.emit();
        }
    }

    /**
     * Dynamically generate component based on variable type
     */
    generateComponent() {
        if (this.typeContainer) {
            this.typeContainer.clear();
        }
        let factory;
        if (this.type === VariableType.Integer) {
            factory = this.resolver.resolveComponentFactory(IntegerTypeComponent);
        } else if (this.type === VariableType.Breakdown) {
            factory = this.resolver.resolveComponentFactory(BreakdownTypeComponent);
        } else if (this.type === VariableType.Real) {
            factory = this.resolver.resolveComponentFactory(RealTypeComponent);
        }

        if (factory) {
            const component = this.typeContainer.createComponent(factory);
            (component.instance).variable = this.variable;
            (component.instance).allVariables = this.allVariables;
            (component.instance).units = this.units;

            component.instance.save.subscribe((forecastVariable: ForecastVariable) => {
                this.onSubmit.emit(forecastVariable);
            });
        }
    }

    /**
     * handles variable type change [Integer, Real, Breakdown].
     * @param type the user selected type
     * checks if there are existing association with the variable for breakdown type variable
     * and warns user of loosing associations if type changes to Integer or Real.
     */
    handleTypeChange(type) {
        if (VariableType[type] === VariableType.Integer || VariableType[type] === VariableType.Real) {
            const associatedVariables = this.forecastApp._getAssociatedVariables(this.variable.id);
            if (associatedVariables.length > 0) {
                this.showingModal = true;
                const dialog = this.modalDialog
                    .confirm()
                    .title('Confirmation')
                    .body('There are existing associations with this variable. Are you sure you want to change the type of this variable? This change cannot be undone.')
                    .okBtn('Yes').okBtnClass('btn btn-danger')
                    .cancelBtn('No')
                    .open();
                dialog.result.then(result => {
                    for (const associatedVariable of associatedVariables) {
                        associatedVariable.content.breakdownIds = associatedVariable.content.breakdownIds.filter(bdId => bdId !== this.variable.id);
                        if (associatedVariable.content.breakdownIds.length === 0) {
                            associatedVariable.content.breakdownIds = null;
                        }
                        const variableIndex = this.forecastApp.modifiedVariableList.findIndex(variable => variable.id === associatedVariable.id);
                        this.forecastApp.modifiedVariableList.splice(variableIndex, 1);
                        this.forecastApp.modifiedVariableList.push(associatedVariable);
                        this.variableService.updateVariable(associatedVariable, associatedVariable.id).subscribe(updatedVariable => {
                        }, (error) => {
                            const response = JSON.parse(error._body);
                            this.modal.showError(response.message);
                        });
                    }
                    this.variable.content.variableType = VariableType[type];
                    if (this.variable.timeSegments && this.variable.timeSegments.length > 0 && this.variable.timeSegments[0].method === TimeSegmentMethod.Breakdown) {
                        this.variable.timeSegments.splice(0, this.variable.timeSegments.length);
                    }
                    this.variable.content.defaultBreakdown = null;
                    this.showingModal = false;
                    this.onSubmit.emit(this.variable);
                    this.generateComponent();

                }).catch(() => {
                    this.showingModal = false;
                    this.trigger = !this.trigger;
                });
            } else {
                this.variable.content.variableType = VariableType[type];
                if (this.variable.timeSegments && this.variable.timeSegments.length > 0 && this.variable.timeSegments[0].method === TimeSegmentMethod.Breakdown) {
                    this.variable.timeSegments.splice(0, this.variable.timeSegments.length);
                }
                this.variable.content.defaultBreakdown = null;
                this.onSubmit.emit(this.variable);
                this.generateComponent();
            }
        } else {
            this.variable.content.variableType = VariableType[type];
            this.variable.timeSegments.splice(0, this.variable.timeSegments.length);
            this.onSubmit.emit(this.variable);
            this.generateComponent();
        }
    }

    handleDeleteClick(variable) {
        this.onDelete.emit(variable);
    }

    saveVariable() {
        this.onSubmit.emit(this.variable);
    }
}
