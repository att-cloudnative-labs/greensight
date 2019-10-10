import { Injectable } from '@angular/core';
/**
 * This may need to be reworked
 */
@Injectable()
export class LayoutEngineService {
    scale = 1;
    x = 0;
    y = 0;
    offsetParent;
    selectRectangleParent;

    // no scaling but transform position applied
    offsetPoint({ x, y }) {
        const offsetRect = this.selectRectangleParent;
        const ox = offsetRect.offsetLeft;
        const oy = offsetRect.offsetTop;
        return {
            x: (x - ox),
            y: (y - oy)
        };
    }

    setOffsetParent(offseParentEl) {
        this.offsetParent = offseParentEl;
    }

    getOffsetParent() {
        return this.offsetParent;
    }

    setSelectRectangleParent(selectRectangleParentEl) {
        this.selectRectangleParent = selectRectangleParentEl;
    }

    // scaling
    translatePoint({ x, y }) {
        if (this.offsetParent) {
            const offsetRect = this.offsetParent.getBoundingClientRect();
            const ox = offsetRect.x;
            const oy = offsetRect.y;

            return {
                x: (x - ox) / this.scale,
                y: (y - oy) / this.scale
            };
        }
        else {
            return {
                x: x,
                y: y
            };
        }
    }

    translateOffset({ x, y }) {
        return {
            x: x / this.scale,
            y: y / this.scale
        };
    }

    get getScaleInPercentage() {
        const scaleInPercent = this.scale * 100;
        return scaleInPercent.toFixed(0) + '%';
    }
}
