import { Component, Input, ViewChild, ElementRef, OnInit, AfterViewInit } from '@angular/core';
import { DistributionSourceMethod } from '@cpt/capacity-planning-projection/lib/distribution';
import { ExpressionCreatorService } from '@app/modules/cpt/services/expression-creator.service';
import { AutocompleteInputComponent } from '../../../../../../auto-complete-input/autocomplete.input.component';

@Component({
    selector: 'time-seg-distribution',
    templateUrl: './time.seg.distribution.component.html',
    styleUrls: ['./time.seg.distribution.component.css']
})
export class TimeSegDistributionComponent implements OnInit, AfterViewInit {
    @Input('distribution') distribution;
    @Input('variable-name') variableName;
    @Input('variable-list') variableList;
    @Input('parentIsExpression') parentIsExpression;
    @Input('fwdKeyEvent') fwdKeyEvent;
    @Input('sheetId') sheetId: string;
    @ViewChild('inputField', { static: false }) inputElement: ElementRef;
    @ViewChild('dist_expression', { static: false }) autoCompleteComponent: AutocompleteInputComponent;

    isExpressionDistribution = false;
    parsedDistributionExpression = [];
    keyboardEvents = ['.', ',', 'Backspace', 'Delete'];
    invalid: Boolean = false;

    constructor(private expressionCreatorService: ExpressionCreatorService) { }

    ngOnInit() {

        // Converts variable list into a format that the projection library can interpret
        this.expressionCreatorService.transformVariablesForExpression(this.variableList);

        if (this.distribution.method === DistributionSourceMethod.Expression) {
            this.isExpressionDistribution = true;

            if (this.distribution.expression) {
                this.expressionCreatorService.clearExpressionArray();
                const ex = this.distribution.expression as any;

                this.expressionCreatorService.parseExpression(ex.jsepExpression);

                this.parsedDistributionExpression = this.expressionCreatorService.dynamicExpressionArray;

                this.distribution.staticStdDev = parseFloat(this.expressionCreatorService.formulateExpression(this.parsedDistributionExpression));
            }
        } else {
            if (!this.distribution.staticStdDev) { this.distribution.staticStdDev = ''; }
        }
    }

    ngAfterViewInit() {
        if (this.inputElement !== undefined) {
            if (this.parentIsExpression) {
                this.inputElement.nativeElement.placeholder = 'Auto';
            } else {
                this.inputElement.nativeElement.placeholder = '0';
            }
        }
    }

    onKeyDown(event) {
        if (isNaN(Number(event.key))) {
            if (event.key === '=') {
                event.preventDefault();

                // Remove commas from timesegment.value if it is a string
                const distributionString = this.distribution.staticStdDev.toString();
                const value = (typeof distributionString === 'string' ? distributionString.replace(/,/g, '') : distributionString);

                if (this.inputElement.nativeElement.selectionStart === 0 && !isNaN(Number(value))) {
                    this.parsedDistributionExpression = [];

                    if (value !== '') {
                        this.transformValueToExpression(value);
                        this.expressionChanged();
                    } else {
                        this.distribution.expression = '';
                    }
                    this.isExpressionDistribution = true;
                    this.distribution.method = DistributionSourceMethod.Expression;
                    setTimeout(() => {
                        this.autoCompleteComponent.focus();
                    }, 0);
                } else {
                    // If unable to delete equals symbol, flash invalid border
                    this.invalid = true;
                    setTimeout(() => { this.invalid = false; }, 500);
                }
            } else if (event.which === 37 || event.which === 38 || event.which === 39 || event.which === 40) {
                // Handle the keyboard arrow events
                event.stopPropagation();
            } else if (this.keyboardEvents.find(x => x === event.key) === undefined) {
                // Do not allow any keyboard events that are not specified
                event.preventDefault();
            }
        } else {
            if (this.distribution.method !== DistributionSourceMethod.Static) { this.distribution.method = DistributionSourceMethod.Static; }
        }
    }

    onKeyUp() {
        this.checkIfAuto();
    }

    /**
     * Check if the distribution method should be auto
     */
    checkIfAuto() {
        if (this.distribution.staticStdDev.toString() === '') {
            this.distribution.method = DistributionSourceMethod.Auto;
        }
    }

    transformValueToExpression(value) {
        this.parsedDistributionExpression.push({
            id: '',
            type: 'const',
            title: parseFloat(value),
            color: 'green'
        });
    }

    /**
     * Swap to auto or static distribution once the equals symbol is deleted
     */
    equalsDeleted() {
        this.distribution.staticStdDev = parseFloat(this.expressionCreatorService.formulateExpression(this.parsedDistributionExpression));
        if (isNaN(this.distribution.staticStdDev)) { this.distribution.staticStdDev = ''; }
        this.distribution.method = DistributionSourceMethod.Static;
        this.checkIfAuto();
        this.isExpressionDistribution = false;
        setTimeout(() => {
            this.inputElement.nativeElement.focus();
        }, 0);
    }

    expressionChanged() {
        this.distribution.expression = this.expressionCreatorService.parseAsExpressionObject(this.expressionCreatorService.formulateExpression(this.parsedDistributionExpression));
    }

    flashInvalid() {
        this.invalid = true;
        setTimeout(() => { this.invalid = false; }, 500);
    }

    focusOnExpression() {
        this.autoCompleteComponent.focus();
    }

    addDistExpressionInputValue() {
        if (this.autoCompleteComponent) { this.autoCompleteComponent.addInputValue(); }
    }
}
