import { Component, Input, ViewChild, ElementRef, Output, EventEmitter, HostListener, AfterViewInit, OnInit } from '@angular/core';
import { Distribution, DistributionType } from '@cpt/capacity-planning-projection';
import { TimeSegmentMethod } from '@cpt/capacity-planning-projection/lib/timesegment';
import { DistributionSourceMethod } from '@cpt/capacity-planning-projection/lib/distribution';
import { VariableType } from '@cpt/capacity-planning-projection/lib';
import { Utils } from '../../../../../../../../../utils_module/utils';
import { TimeSegDistributionComponent } from '../time-seg-distribution/time.seg.distribution.component';
import { Expression } from '@cpt/capacity-planning-projection/lib/expression';

@Component({
    selector: 'constant-edit',
    templateUrl: './constant.edit.component.html',
    styleUrls: ['../../timesegment.edit.common.css', './constant.edit.component.css']
})
export class ConstantEditComponent implements OnInit, AfterViewInit {
    @Input('timesegment') timesegment;
    @Input('variable') variable;
    @Input('variableList') variableList;
    @Input('fwdKeyEvent') fwdKeyEvent;
    @Output('enterPressed') submitChanges = new EventEmitter();
    @Output('timeSegTypeChanged') timeSegTypeChanged = new EventEmitter();
    @ViewChild('inputProjected') projectedInputElement: ElementRef;
    @ViewChild(TimeSegDistributionComponent) timeSegDistComponent: TimeSegDistributionComponent;
    @ViewChild('growthInput') growthInput: ElementRef;

    keyboardEvents = ['.', ',', 'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    invalid = false;

    // Used as a substitute for the distribution to prevent automatic binding
    // to the time segment distribution value
    tempDist;
    growth;

    constructor(private _el: ElementRef) {
    }

    ngOnInit() {
        if (!this.timesegment.distribution) {
            this.tempDist = {
                distributionType: DistributionType.Gaussian,
                method: DistributionSourceMethod.Auto
            };
        } else {
            this.tempDist = Object.assign({}, this.timesegment.distribution);
        }

        if (isNaN(this.timesegment.value)) {
            this.timesegment.value = '';
        } else {
            if (this.timesegment.method === TimeSegmentMethod.Basic && this.timesegment.value !== undefined && this.timesegment.value !== '') {
                if (this.variable.variableType !== VariableType.Integer) {
                    this.timesegment.value = parseFloat((this.timesegment.value)).toFixed(Utils.getCurrentUserSettings().VARIABLE_DECIMAL);
                } else {
                    this.timesegment.value = Math.round(this.timesegment.value);
                }
            }
        }

        this.growth = Number(this.timesegment.growth);
        if (isNaN(this.growth)) {
            this.growth = 0;
        }
        this.growth = (this.growth * 100).toFixed(1);

        if (this.fwdKeyEvent !== undefined && this.fwdKeyEvent.key === '=') {
            setTimeout(() => {
                this.timesegment.value = '';
                this.timeSegTypeChanged.emit(TimeSegmentMethod.Expression);
            }, 0);
        }

    }

    /**
     * auto focuses on the input field for projected values
     */
    ngAfterViewInit() {
        this.growthInput.nativeElement.type = 'text';
        this.growthInput.nativeElement.value = String(this.growth) + '%';
        if (this.fwdKeyEvent !== undefined) {
            const numKey = Number(this.fwdKeyEvent.key);
            if (numKey >= 0 && numKey <= 9) {
                setTimeout(() => {
                    this.projectedInputElement.nativeElement.focus();
                    this.timesegment.value = this.fwdKeyEvent.key;
                }, 0);
            }
        } else {
            setTimeout(() => {
                this.projectedInputElement.nativeElement.focus();
                this.projectedInputElement.nativeElement.select();
            }, 0);
        }
    }

    onGrowthInputFocus(event) {
        this.growthInput.nativeElement.value = this.growth;
        setTimeout(() => {
            this.growthInput.nativeElement.select();
        }, 0);
    }

    onGrowthInputBlur(event) {
        this.growth = Number(this.growthInput.nativeElement.value);
        this.growthInput.nativeElement.value = String(this.growth) + '%';
    }

    onGrowthInputKeyDown(event) {
        const allowedKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '.', '-', 'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
        if (allowedKeys.find(x => x === event.key) !== undefined) {
            this.growth = Number(this.growthInput.nativeElement.value);
        } else {
            event.preventDefault();
        }
    }

    /*
    * keydown handler for timesegment.value input
    */
    onKeyDown(event) {
        if (event.key === 'Home') {
            event.preventDefault();
            event.target.setSelectionRange(0, 0);
        }

        if (event.key === 'End') {
            event.preventDefault();
            event.target.setSelectionRange(event.target.value.length, event.target.value.length);
        }

        if (isNaN(Number(event.key))) {
            if (event.key === '=') {
                event.preventDefault();

                if (this.projectedInputElement.nativeElement.selectionStart === 0 && !isNaN(Number(this.projectedInputElement.nativeElement.value.replace(/,/g, '')))) {
                    let text = this.projectedInputElement.nativeElement.value;
                    text = text.slice(0, this.projectedInputElement.nativeElement.selectionStart) + text.slice(this.projectedInputElement.nativeElement.selectionEnd);
                    // Remove commas from timesegment.value if it is a string
                    this.timesegment.value = text.replace(/,/g, '');
                    // Change time segment type to expression
                    this.timeSegTypeChanged.emit(TimeSegmentMethod.Expression);
                } else {
                    this.flashInvalid();
                }
            } else if (this.keyboardEvents.find(x => x === event.key) === undefined) {
                console.log(`Preventing default keydown behavior for "${event.key}" in constant.edit.component.ts#onKeydown()`);
                event.preventDefault();
            }
        }
    }

    onSubmit() {
        let tempValue = this.timesegment.value;
        if (typeof tempValue === 'string') {
            tempValue = tempValue.replace(/,/g, '');
        }
        this.timesegment.value = tempValue;
        this.timesegment.value = parseFloat(this.timesegment.value);
        this.timesegment.growth = this.growth / 100;

        if (this.tempDist.method === DistributionSourceMethod.Expression) {
            if (this.tempDist.expression instanceof Expression) {
                this.timesegment.distribution = this.tempDist;

                this.submitChanges.emit(this.timesegment);
            } else {
                if (isNaN(this.timesegment.value)) {
                    this.resetProjectedValue();
                }
                this.timeSegDistComponent.flashInvalid();
            }
        } else {
            this.growth = Number(this.growthInput.nativeElement.value);
            this.growthInput.nativeElement.value = String(this.growth) + '%';
            if (!isNaN(this.growth)) {
                this.timesegment.growth = this.growth / 100;
            }
            this.timesegment.distribution = this.tempDist;
            this.timesegment.distribution.staticStdDev = parseFloat(this.timesegment.distribution.staticStdDev);
            this.submitChanges.emit(this.timesegment);
        }
    }

    resetProjectedValue() {
        this.timesegment.value = '';
    }

    /**
     * Keydown handler for constant edit component
     * @param event
     */
    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        if (event.which === 9 || event.which === 13) {
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

    flashInvalid() {
        this.invalid = true;
        setTimeout(() => { this.invalid = false; }, 500);
    }
}
