import { Utils } from '../../utils_module/utils';
import { ForecastFrame } from './forecast-frame';
import { ForecastVariable } from './forecast-variable';

// TODO: Rename this sto forecast-variable-projection.ts after merge
export class ForecastVariableProjection {
    display: boolean;
    isExpanded = false;
    color: string;
    subframeNames: string[] = [];

    constructor(public variable: ForecastVariable, public frames: ForecastFrame[], public variableList: ForecastVariable[]) {
        this._setup();
    }

    /*
    * Updates a ForecastVariableProjection in-place, rerunning its setup function
    * and only updating the frames passed. Frames must be contiguous to existing
    * frames and sorted with earliest frame first.
    */
    update(variable: ForecastVariable, frames: ForecastFrame[], variableList: ForecastVariable[]) {
        this.variable = variable;
        this.variableList = variableList;

        const beforeFrames = [];
        const afterFrames = [];

        frames.forEach(newFrame => {
            // Update the frame if it exists
            const existingFrame = this.frames.find(f => f.date === newFrame.date);
            if (existingFrame) {
                existingFrame.update(newFrame);
                return;
            }

            // Otherwise sort it into a before or after bucket to unshift or push in the proper order
            if (newFrame.isBefore(this.frames[0])) {
                beforeFrames.push(newFrame);
            } else {
                afterFrames.push(newFrame);
            }
        });

        this.frames.unshift(...beforeFrames);
        this.frames.push(...afterFrames);

        this._setup();
    }

    _setup() {
        if (this.variable.content.color) {
            this.color = this.variable.content.color;
        } else {
            this.color = Utils.getColor();
        }

        this._updateSubframeNames();
    }

    _updateSubframeNames() {
        const subframes = this.frames[0].subFrames;

        if (!subframes) {
            this.subframeNames = [];
            return;
        }

        // Remove subFramenames that are no longer present
        this.subframeNames
            .filter(sfn => !subframes.find(sf => sf.name === sfn))
            .forEach(sfn => {
                this.subframeNames.splice(
                    this.subframeNames.indexOf(sfn)
                    , 1
                );
            });

        // Add new subFramenames
        this.frames[0].subFrames.forEach(sf => {
            if (this.subframeNames.indexOf(sf.name) === -1) {
                this.subframeNames.push(sf.name);
            }
        });
    }
}
