import { Component, Output, EventEmitter, Input } from '@angular/core';
import * as $ from 'jquery';

/**
* Responsible for detecting a drag event that is to change the width of the first column
* in the spreadsheet and emitting the the new width
*/
@Component({
    selector: 'cell-resize-handler',
    templateUrl: './cell.resize.handler.component.html',
    styleUrls: ['./cell.resize.handler.component.css']
})
export class CellResizeHandlerComponent {
    @Output('onColumnResize') onColumnResize = new EventEmitter();
    @Input('resizeId') id: string;

    /**
     * Emits movements of the mouse while the mouse button is held down.
     * It stops listening to mouse movements when the mouse button is released.
     * @param event the inital mousedown event that occured on this component's div element
     */
    handleResize(event: MouseEvent) {
        const sidebarWidth = 100;

        $(document).on(`mousemove.${this.id}`, (event) => {
            event.preventDefault();
            // determine new width by deducting sidebar width from current mouse position
            let width = event.pageX - sidebarWidth;
            width = Math.max(width, 125);
            this.onColumnResize.emit(width);
        });
        $(document).on(`mouseup`, (event) => {
            $(document).off(`mousemove.${this.id}`);
        });
    }
}
