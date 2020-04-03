import { Injectable, OnDestroy } from '@angular/core';
import { LayoutEngineService } from './layout-engine.service';
import { v4 as uuid } from 'uuid';

@Injectable()
export class PanService implements OnDestroy {
    mouseDownClientX: any;
    mouseDownClientY: any;
    originalX: any;
    originalY: any;
    isPanning = false;
    disabled: Boolean = true;
    private _uuid: string;
    private _styleEl;

    mouseDownHandler = this.onMouseDown.bind(this);
    constructor(private layoutEngineService: LayoutEngineService) {
        this._uuid = uuid();
        document.addEventListener('mousedown', this.mouseDownHandler);
    }

    ngOnDestroy() {
        document.removeEventListener('mousedown', this.mouseDownHandler);
    }

    enable() {
        this.disabled = false;
    }

    disable() {
        this.disabled = true;
    }

    setDraggingCursor() {
        if (!this._styleEl) {
            this._styleEl = document.createElement('style');
            document.head.appendChild(this._styleEl);
            const styleSheet = this._styleEl.sheet;
            styleSheet.insertRule('* { cursor: grab !important; }');
        }
    }

    restoreCursor() {
        if (this._styleEl) {
            document.head.removeChild(this._styleEl);
            this._styleEl = undefined;
        }
    }

    onMouseDown(mouseDownEvent) {
        if (this.disabled) {
            return;
        }
        if (mouseDownEvent.target.matches('.grid') && mouseDownEvent.button === 2) {
            this.isPanning = true;
            this.mouseDownClientX = mouseDownEvent.clientX;
            this.mouseDownClientY = mouseDownEvent.clientY;
            this.originalX = this.layoutEngineService.x;
            this.originalY = this.layoutEngineService.y;
            $(document).on(`mousemove.dragmanager.` + this._uuid, (mouseMoveEvent) => {
                this.onMouseMove(mouseMoveEvent);
            });

            // when mouse is released
            $(document).on(`mouseup.dragmanager.` + this._uuid, (mouseUpEvent) => {
                $(document).off(`mousemove.dragmanager.` + this._uuid);
                $(document).off(`mouseup.dragmanager.` + this._uuid);
                this.onMouseUp(mouseUpEvent);
            });

            this.setDraggingCursor();
        }
    }

    onMouseMove(mouseMoveEvent) {
        if (this.disabled) {
            return;
        }
        if (this.isPanning === true) {
            mouseMoveEvent.preventDefault();
            const dx = this.mouseDownClientX - mouseMoveEvent.clientX;
            const dy = this.mouseDownClientY - mouseMoveEvent.clientY;

            this.layoutEngineService.x = this.originalX - dx;
            this.layoutEngineService.y = this.originalY - dy;
        }
    }

    onMouseUp(mouseUpEvent) {
        if (this.disabled) {
            return;
        }
        if (this.isPanning) {
            mouseUpEvent.preventDefault();
        }
        this.restoreCursor();
        this.isPanning = false;
    }

    panOnWheel(wheelEvent) {
        this.layoutEngineService.x = this.layoutEngineService.x - wheelEvent.deltaX;
        this.layoutEngineService.y = this.layoutEngineService.y - wheelEvent.deltaY;
    }
}

