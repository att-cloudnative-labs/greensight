import { Component, Input, OnInit, OnChanges } from '@angular/core';

import { LayoutEngineService } from '@system-models/components/graph-model-editor/services/layout-engine.service';
import { CablePullService } from '@system-models/components/graph-model-editor/services/cable-pull.service';
import { Anchor } from '@system-models/components/graph-model-editor/services/cable-pull.service';

@Component({
    selector: '[app-gm-connection]',
    templateUrl: './gm-connection.component.html',
    styleUrls: ['./gm-connection.component.css']
})
export class GmConnectionComponent implements OnInit, OnChanges {
    @Input() source;
    @Input() destination;
    public d: string; // the d attribute of the svg path
    private _previousSrcCoords;
    private _previousDestCoords;

    constructor(
        private layoutEngineService: LayoutEngineService,
        private cablePullService: CablePullService
    ) { }

    ngOnInit() { }

    /**
     * Redraws the connection whenever its source/target is changed
     * The graph editor must be completely initialized in order for connections to
     * be drawn
     */
    ngOnChanges() {
        // TODO: This is not a great way to handle initialization issues
        setTimeout(() => {
            this.redraw();
        }, 0);
    }

    /**
     * Redraws the connection by retrieving the latest path for that connnection
     */
    redraw() {
        const D = this.calculateD();
        if (D) {
            this.d = D;
        }
    }

    /**
     * Gets the coordinates for a source or destination
     * @param what the { x, y } coordinates or a port id to get coords for
     */
    getCoords(what, portType) {
        if (what.x && what.y) {
            return this.layoutEngineService.translatePoint(what);
        }

        if (typeof what === 'string') {
            const anchor = this.cablePullService.anchors.find(x => x.id === what && x.portType === portType);

            if (anchor) {
                return this.calculatePinCenter(anchor);
            } else {
                console.error(`Couldn't find an anchor for id '${what}'`);
            }
        }
    }

    calculatePinCenter(anchor: Anchor) {
        const rect = anchor.nativeElement.getBoundingClientRect() as DOMRect;

        return this.layoutEngineService.translatePoint({
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2
        });
    }

    calculateD() {
        const srcCoords = this.getCoords(this.source, 'source');
        const tgtCoords = this.getCoords(this.destination, 'destination');

        if (!srcCoords || !tgtCoords) {
            return;
        }

        if (!this._previousSrcCoords || !this._previousDestCoords || (srcCoords.x != this._previousSrcCoords.x || srcCoords.y != this._previousSrcCoords.y) || (tgtCoords.x != this._previousDestCoords.x || tgtCoords.y != this._previousDestCoords.y)) {
            this._previousSrcCoords = srcCoords;
            this._previousDestCoords = tgtCoords;
            const x1 = srcCoords.x;
            const y1 = srcCoords.y;
            const x2 = tgtCoords.x;
            const y2 = tgtCoords.y;
            // let verticalDistance = y2 - y1;
            // let horizontalDistance = x2 - x1;
            // create bezier curve
            const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            const angle = Math.atan2(y2 - y1, x2 - x1);
            const ctMax = 250;
            const distanceScalingFactor = Math.min(1, 1 - (100 - distance) / 100);
            const ctScalingFactor = Math.abs(angle) / Math.PI * distanceScalingFactor;
            const ct = ctMax * ctScalingFactor;
            return `
            M ${x1},${y1}
            C ${x1 + ct},${y1} ${x2 - ct},${y2} ${x2},${y2}
            `;
        } else {
            return;
        }
    }

}
