import { Injectable } from '@angular/core';
import { LayoutEngineService } from './layout-engine.service';

@Injectable()
export class ScaleService {
    constructor(private layoutEngineService: LayoutEngineService) {

    }

    scaleOnWheel(wheelEvent) {
        wheelEvent.preventDefault();
        const vector = wheelEvent.deltaY;
        let deltaScale;
        if (vector < 0) {
            deltaScale = Math.min(-0.01, vector / 1000);
        } else {
            deltaScale = Math.max(0.01, vector / 1000);
        }

        const scale = Math.round(100 * Math.min(1.25, Math.max(0.2, this.layoutEngineService.scale - deltaScale))) / 100;
        this.layoutEngineService.scale = scale;
    }
}
