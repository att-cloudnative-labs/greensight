import { SubFrame as ProjectionSubFrame } from '@cpt/capacity-planning-projection/lib';
import { ForecastFrame } from './forecast-frame';
import { ForecastVariable } from './forecast-variable';

export class ForecastSubFrame {
    constructor(
        public subFrame: ProjectionSubFrame,
        public frame: ForecastFrame
    ) { }

    update(newSubFrame: ProjectionSubFrame, newFrame: ForecastFrame) {
        this.subFrame = newSubFrame;
        this.frame = newFrame;
    }

    get date(): string {
        return this.frame.date;
    }

    get value() {
        return this.subFrame.value;
    }

    get name(): string {
        return this.subFrame.name;
    }

    get variable(): ForecastVariable {
        return this.frame.variable;
    }
}
