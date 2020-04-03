import {
    Component, Input, Output, EventEmitter, ViewChild, ViewContainerRef,
    ComponentFactoryResolver, ElementRef, HostListener, OnInit, OnChanges
} from '@angular/core';
import { VariableType } from '@cpt/capacity-planning-projection/lib';
import { IntegerTypeComponent } from './types/integer/integer.type.component';
import { BreakdownTypeComponent } from './types/breakdown/breakdown.type.component';
import { RealTypeComponent } from './types/real/real.type.component';
import { ForecastVariable } from '@app/modules/cpt/interfaces/forecast-variable';
import { Unit } from '@app/modules/cpt/interfaces/unit';
import { ModalDialogService } from '@app/modules/cpt/services/modal-dialog.service';
import { Modal } from 'ngx-modialog-7/plugins/bootstrap';
import { Store } from '@ngxs/store';
import { SelectedVariableType } from '@app/modules/cpt/state/forecast-sheet.action';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';


@Component({
    selector: 'variable-editor',
    templateUrl: './variable.editor.component.html',
    styleUrls: ['./variable.editor.component.css']
})
export class VariableEditorComponent implements OnInit, OnChanges {
    @Input('variable') variable: ForecastVariable;
    @Input('allVariables') allVariables: Array<ForecastVariable>;
    @Input('units') units: Array<Unit>;
    @Input('startDate') startDate: string;
    @Input('buttonId') buttonId: string;
    @Input('sheetId') sheetId: string;
    @Output('onDelete') onDelete = new EventEmitter();
    @Output('onSubmit') onSubmit = new EventEmitter();
    @Output('onEscape') onEscape = new EventEmitter();
    @Output('onClose') onClose = new EventEmitter();
    @Output('onChangeType') onChangeType = new EventEmitter<VariableType>();

    @ViewChild('nameField', { static: false }) nameField: ElementRef;
    @ViewChild('typeContainer', { read: ViewContainerRef, static: true }) typeContainer;

    public trigger = false;

    private showingModal = true;

    constructor(private resolver: ComponentFactoryResolver, private _el: ElementRef,
        private modal: ModalDialogService,
        private modalDialog: Modal,
        private store: Store) { }

    ngOnInit() {
        this.showingModal = false;
        this.trigger = false;

    }

    ngOnChanges() {
        this.generateComponent();
    }

    get type(): string {
        return this.variable.variableType;
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
    handleTypeChange(type: string) {

        this.store.dispatch(new SelectedVariableType({ sheetId: this.sheetId, variableId: this.variable.id, variableType: VariableType[type] })).pipe(
            catchError(e => {
                console.log('fail ' + e);
                if (e === 'Still associations') {
                    this.showingModal = true;
                    const dialog = this.modalDialog
                        .confirm()
                        .title('Confirmation')
                        .body('There are existing associations with this variable. Are you sure you want to change the type of this variable? This change cannot be undone.')
                        .okBtn('Yes').okBtnClass('btn btn-danger')
                        .cancelBtn('No')
                        .open();
                    dialog.result.then(result => {
                        this.showingModal = false;
                        this.store.dispatch(new SelectedVariableType({ sheetId: this.sheetId, variableId: this.variable.id, variableType: VariableType[type], force: true }))
                    }).catch(() => {
                        this.showingModal = false;
                        this.trigger = !this.trigger;
                    });
                }
                return of('');
            }
            )).subscribe();


    }

    handleDeleteClick(variable) {
        this.onDelete.emit(variable);
    }

    saveVariable() {
        this.onSubmit.emit(this.variable);
    }
}
