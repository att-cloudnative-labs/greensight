import { Component, Input, EventEmitter, Output, ElementRef, ViewChild, HostListener, AfterViewChecked, AfterViewInit, OnInit } from '@angular/core';
import { DistributionType } from '@cpt/capacity-planning-projection/lib';
import { Expression } from '@cpt/capacity-planning-projection/lib/expression';
import { ForecastVariableModel } from '../../../../../../../../interfaces/forecast-variable';
import { DistributionSourceMethod } from '@cpt/capacity-planning-projection/lib/distribution';
import { AutocompleteInputComponent } from '../../../../../../../../../utils_module/components/auto-complete-input/autocomplete.input.component';
import { TimeSegDistributionComponent } from '../time-seg-distribution/time.seg.distribution.component';
import { ExpressionCreatorService } from '../../../../../../../../service/expression-creator.service';
import { TimeSegmentExpression, TimeSegmentMethod } from '@cpt/capacity-planning-projection/lib/timesegment';

@Component({
    selector: 'expression-edit',
    templateUrl: './expression.edit.component.html',
    styleUrls: ['../../timesegment.edit.common.css', './expression.edit.component.css']
})
export class ExpressionEditComponent implements OnInit, AfterViewInit {
    @Input('timesegment') timesegment;
    @Input('variable') variable;
    @Input('variableList') variableList;
    @Input('fwdKeyEvent') fwdKeyEvent;
    @Output('submitChanges') submitChanges = new EventEmitter();
    @Output('timeSegTypeChanged') timeSegTypeChanged = new EventEmitter();

    @ViewChild('expression') autocompleteComponent: AutocompleteInputComponent;
    @ViewChild('distribution') autocompleteDistComponent: AutocompleteInputComponent;

    @ViewChild('inputExpression') inputExpressionElement: ElementRef;
    @ViewChild(TimeSegDistributionComponent) timeSegDistComponent: TimeSegDistributionComponent;

    width: string;
    originalWidth;

    // Dynamic array that contains either the parsed expression or parsed distribution expression
    dynamicExpressionArray = [];
    parsedExpression = [];
    parsedDistributionExpression = [];

    invalidExpression: Boolean = false;
    invalidDistExpression: Boolean = false;

    constantInput = '';
    expressionString: String = '';
    distExpressionString: String = '';
    widthScale = 1;

    // Used as a substitute for the distribution to prevent automatic binding
    // to the time segment distribution value
    tempDist;

    constructor(private expressionCreatorService: ExpressionCreatorService,
        private _el: ElementRef) { }

    ngOnInit() {
        this.expressionCreatorService.transformVariablesForExpression(this.variableList);

        this.parsedExpression = [];

        if (this.timesegment.expression && this.timesegment.expression.jsepExpression) {
            this.expressionCreatorService.clearExpressionArray();
            this.expressionCreatorService.parseExpression(this.timesegment.expression.jsepExpression);
            this.parsedExpression = this.expressionCreatorService.dynamicExpressionArray;
        } else {
            this.transformValueToExpression();
        }

        if (!this.timesegment.distribution) {
            this.tempDist = {
                distributionType: DistributionType.Gaussian,
                method: DistributionSourceMethod.Auto
            };
        } else {
            this.tempDist = Object.assign({}, this.timesegment.distribution);
        }

        this.expressionString = this.expressionCreatorService.formulateExpression(this.parsedExpression);
    }

    /**
     * Auto focuses on the input field for projected values
     */
    ngAfterViewInit() {
        this.originalWidth = this.inputExpressionElement.nativeElement.offsetWidth;
    }

    transformValueToExpression() {
        if (this.timesegment.expression) {
            this.parsedExpression.push({
                id: '',
                type: 'const',
                title: parseFloat(this.timesegment.expression),
                color: 'green'
            });
        } else {
            this.timesegment.expression = '';
        }
    }

    /**
     * Change time segment type to basic
     */
    equalsDeleted() {
        this.expressionString = this.expressionCreatorService.formulateExpression(this.parsedExpression);

        this.timesegment.expression = this.expressionString;
        this.timeSegTypeChanged.emit(TimeSegmentMethod.Basic);
    }

    expressionChanged() {
        this.expressionString = this.expressionCreatorService.formulateExpression(this.parsedExpression);
        const parsedExpression = this.expressionCreatorService.parseAsExpressionObject(this.expressionString);
    }

    focusOnExpression() {
        this.autocompleteComponent.focus();
    }

    focusOnDistributionExpression() {
        this.autocompleteDistComponent.focus();
    }

    flashInvalid() {
        this.invalidExpression = true;
        setTimeout(() => { this.invalidExpression = false; }, 1000);
    }

    onSubmit() {
        this.expressionString = this.expressionCreatorService.formulateExpression(this.parsedExpression);

        const parsedExpression = this.expressionCreatorService.parseAsExpressionObject(this.expressionString);

        if (parsedExpression instanceof Expression) {
            this.timesegment.expression = parsedExpression;

            if (this.tempDist.method === DistributionSourceMethod.Expression) {
                if (this.tempDist.expression instanceof Expression) {
                    this.timesegment.distribution = this.tempDist;
                    this.timesegment.growth = 0;
                    this.submitChanges.emit(this.timesegment);
                } else {
                    this.timeSegDistComponent.flashInvalid();
                }
            } else {
                this.timesegment.distribution = this.tempDist;
                this.timesegment.distribution.staticStdDev = parseFloat(this.timesegment.distribution.staticStdDev);
                this.timesegment.growth = 0;
                this.submitChanges.emit(this.timesegment);
            }
        } else {
            this.invalidExpression = true;
            setTimeout(() => { this.invalidExpression = false; }, 1000);
        }
    }

    /**
     * FIXME: should make this function usable in the onSubmit function
     */
    hasValidExpressions() {
        this.autocompleteComponent.addInputValue();
        this.expressionString = this.expressionCreatorService.formulateExpression(this.parsedExpression);

        const parsedExpression = this.expressionCreatorService.parseAsExpressionObject(this.expressionString);

        if (parsedExpression instanceof Expression) {
            this.timesegment.expression = parsedExpression;

            if (this.timesegment.distribution.method === DistributionSourceMethod.Expression) {
                this.timeSegDistComponent.addDistExpressionInputValue();
                if (this.timesegment.distribution.expression instanceof Expression) {
                    return true;
                } else {
                    this.timeSegDistComponent.flashInvalid();
                    return false;
                }
            } else {
                this.timesegment.distribution.staticStdDev = parseFloat(this.timesegment.distribution.staticStdDev);
                return true;
            }
        } else {
            this.invalidExpression = true;
            setTimeout(() => { this.invalidExpression = false; }, 1000);
            return false;
        }
    }
    /**
     * Scales the width of the expression edit to ensure that the whole expression is visible
     * @param expressionWidth the width of the entire expression (including the input field)
     */
    onWidthChanged(expressionWidth) {
        if (this.originalWidth !== undefined) {
            const newWidthScale = Math.ceil(expressionWidth / this.originalWidth);
            if (newWidthScale > this.widthScale) {
                this.widthScale = newWidthScale;
                this.width = `calc(${this.widthScale * 100}% + ${this.widthScale - 1}px)`;
            }
        }
    }

    /**
     * Keydown handler for expression edit component
     * @param event
     */
    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        if (event.which === 37 || event.which === 38 || event.which === 39 || event.which === 40 || event.which === 9 || event.which === 13) {
            event.preventDefault();
            this.onSubmit();
        }
    }

    /**
     * Emits a save event if a click event occurs outside of the frame editor
     */
    @HostListener('document:click', ['$event', '$event.target'])
    clickOutside(event: MouseEvent, targetElement: HTMLElement): void {
        if (!targetElement) {
            return;
        }
        const clickedInside = this._el.nativeElement.contains(targetElement) || targetElement.closest('#editor-target')
            || targetElement.closest('#suggestionList') || targetElement.closest('#completedWord')
            || targetElement.closest('.actual-projected-selector');
        if (!clickedInside) {
            this.autocompleteComponent.addInputValue();
            this.timeSegDistComponent.addDistExpressionInputValue();
            this.onSubmit();
        }
    }

    /**
     * listens for a backspace key press and emits an event whenever this occurs
     */
    @HostListener('document:keydown.backspace', ['$event'])
    onBackspacePressed(event) {
        event.stopImmediatePropagation();
    }
}
