import { Component, Output, EventEmitter, Input } from '@angular/core';

@Component({
    selector: 'actual-projected-toggle',
    templateUrl: './actual.projected.toggle.component.html',
    styleUrls: ['./actual.projected.toggle.component.css']
})
export class ActualProjectedToggleComponent {
    @Output('selectedOption') selectedOption = new EventEmitter();
    @Input('editingActual') editingActual: Boolean = true;

    click(option: string) {
        this.selectedOption.emit(option);
    }
}
