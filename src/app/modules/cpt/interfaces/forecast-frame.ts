import {
    Frame as ProjectionFrame,
    TimeSegment,
    Distribution,
    VariableType
} from '@cpt/capacity-planning-projection/lib';
import * as moment from 'moment';
import { TimesegmentModel } from './timesegment';
import { ForecastVariable } from './forecast-variable';
import { ForecastSubFrame } from './forecast-sub-frame';

export class ForecastFrame implements ProjectionFrame {
    timeSegment: TimesegmentModel;
    public isPast: boolean;
    public subFrames: ForecastSubFrame[] = new Array<ForecastSubFrame>();

    constructor(public frame: ProjectionFrame, public variable: ForecastVariable, public variableList: ForecastVariable[], timeSegment?: TimeSegment) {
        if (timeSegment) {
            this.timeSegment = this.getTimesegment(timeSegment);
        }
        this._setup();
    }

    update(newFrame: ForecastFrame) {
        this.frame = newFrame.frame;
        this.variable = newFrame.variable;
        this.variableList = newFrame.variableList;
        if (newFrame.timeSegment) {
            this.timeSegment = this.getTimesegment(newFrame.timeSegment);
        } else {
            this.timeSegment = null;
        }
        this._setup();
    }

    _setup() {
        this.isPast = moment().startOf('month').diff(moment(this.frame.date)) > 0;

        // TODO: Update instead of replace
        if (this.frame.subFrames) {
            this.subFrames = this.frame.subFrames.map(sf => new ForecastSubFrame(sf, this));
        } else {
            this.subFrames = [];
        }
    }

    isBefore(frame: ForecastFrame): boolean {
        return moment(this.date, 'YYYY-MM').isBefore(moment(frame.date, 'YYYY-MM'));
    }

    isAfter(frame: ForecastFrame): boolean {
        return moment(this.date, 'YYYY-MM').isAfter(moment(frame.date, 'YYYY-MM'));
    }

    get highlightError(): boolean {
        return (
            this.frame.projectionCalculationError !== undefined
            || this.frame.distributionCalculationError !== undefined
            || this.frame.frameDependencyError !== undefined
        );
    }

    get errorMsg(): string {
        if (this.frame.projectionCalculationError !== undefined) {
            return 'Projection Calculation Error: ' + this.frame.projectionCalculationError;
        } else if (this.frame.distributionCalculationError !== undefined) {
            return 'Distribution Calculation Error: ' + this.frame.distributionCalculationError;
        } else if (this.frame.frameDependencyError !== undefined) {
            return 'Frame Dependency Error: ' + this.frame.frameDependencyError;
        } else {
            return '';
        }
    }

    get actualValue(): number | undefined {
        return this.frame.actualValue;
    }

    public addSubframe(name: string, value: number) { }

    get date(): string {
        return this.frame.date;
    }

    get projectedValue(): number | undefined {
        if (this.variable.variableType === VariableType.Breakdown) {
            let total = 0;
            if (this.subFrames !== undefined) {
                for (const sub of this.subFrames) {
                    total += sub.value;
                }
            }
            return total;
        } else {
            return this.frame.projectedValue;
        }
    }

    get distribution(): Distribution | undefined {
        return this.frame.distribution;
    }

    getTimesegment(timeSegment) {
        const persistedVar: ForecastVariable = this.variableList.find(x => (x.id === this.variable.id));
        const timeSeg = persistedVar.content.timeSegments.find(x => (x.date === timeSegment.date));
        return timeSeg;
    }

    get hasActual(): boolean {
        return this.frame.actualValue !== undefined;
    }
}
