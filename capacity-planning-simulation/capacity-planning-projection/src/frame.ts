import { Variable, VariableType } from './variable';
import { Distribution } from './distribution';
import { TimeSegment, TimeSegmentMethod } from './timesegment';

export class SubFrame {
    constructor(public name: string, public value: number) {
    }
}

export interface AssociatedBreakdown {
    id: string,
    name: string,
    slices: {[label: string]: number}
}

export class Frame {
    public subFrames?: SubFrame[];
    public frameDependencyError?: string;
    public projectedValue?: number;
    public projectionCalculationError?: string;
    public distribution?: Distribution;
    public distributionCalculationError?: string;
    public actualValue?: number;
    public associatedBreakdowns?: AssociatedBreakdown[];

    constructor(public date: string, public unit?: string) {
    }

    public addSubframe(name: string, value: number) {
        if (!this.subFrames) {
            this.subFrames = [];
        }
        this.subFrames.push(new SubFrame(name, value));
    }
}
export class VariableRenderState {
    public ts?: TimeSegment;
    public f?: Frame;
    public dependencyError?: Error;
    public dependencies: string[] = [];
    constructor(public v: Variable) {
    }
}


/**
 * FrameRenderContext holds the state of the
 * render progress and enables variables to access the
 * results of other variables during rendering.
 *
 * It also adds the magic to determine the render order
 * for each run so all dependencies between variables
 * are met (if possible).
 *
 */
export class FrameRenderContext {
    public renderState: { [varId: string]: VariableRenderState } = {};

    // helper to update a timesegment
    public pushTimesegment(v: Variable, ts: TimeSegment) {
        this.renderState[v.id].ts = ts;
    }

    // helper to update a frame
    public pushFrame(v: Variable, f: Frame) {
        this.renderState[v.id].f = f;

    }

    /**
     * Do a topological sort of the variables using Kahn's algorithn
     * as to https://en.wikipedia.org/wiki/Topological_sorting
     *
     * @param unsortedRenderStates a list of renderstates with
     *        it's depencies exposed in the dependencies property
     * @returns an ordered list of renderstates. if the dependencies of a single one
     *          could not be fulfilled the dependencyError property will be set.
     */
    private kahnSortVars(unsortedRenderStates: VariableRenderState[]): VariableRenderState[] {

        // sorted list of variables
        let l: VariableRenderState[] = [];

        // variables without dependencies
        let s: VariableRenderState[] = [];

        // populate the list of variables without dependencies
        for (let vrs of unsortedRenderStates) {
            if (vrs.dependencies.length === 0) {
                s.push(vrs);
            }
        }

        let n: VariableRenderState | undefined = s.pop();

        // go through the list of variables without unfulfilled dependencies
        while (n !== undefined) {
            let noDepVar = n as VariableRenderState;
            l.push(noDepVar);
            // look for variables depending on n
            for (let v of unsortedRenderStates) {
                if (v.dependencies.indexOf(noDepVar.v.id) > -1) {
                    // remove dependency to n, as that is fulfilled now.
                    v.dependencies = v.dependencies.filter((id) => id !== noDepVar.v.id);
                    // if no deps are left we can store the variable in the list
                    // of variables without dependecies
                    if (v.dependencies.length === 0) {
                        s.push(v);
                    }
                }
            }
            n = s.pop();
        }

        // now all depency lists should be empty. if not we could not fulfill the dependencies.
        // marks as erroneous an append to sortes variables;
        for (let vrs of unsortedRenderStates) {
            if (vrs.dependencies.length > 0) {
                vrs.dependencyError = new Error("could not determine render order");
                l.push(vrs);
            }
        }
        return l;
    }

    /**
     * Bring order (based on dependencies) to our list
     * of variables(renderstates).
     * @returns all variables from this.renderState in a topoligical ordering
     */
    private getVarsInRenderOrder(): VariableRenderState[] {
        let varList: VariableRenderState[] = [];

        // collect the dependencies
        // mainly breakdowns and expression references
        // the dependencies are consumed by kahnSortVars()
        for (let varId in this.renderState) {
            let dependencies: string[] = [];
            let varRenderState = this.renderState[varId];
            if (varRenderState.v.breakdownIds !== undefined) {
                dependencies = dependencies.concat(varRenderState.v.breakdownIds);
            }
            if (varRenderState.ts) {
                let tsDeps = varRenderState.ts.getNeededVarIds();
                let calcDependencies = tsDeps.filter((id) => dependencies.indexOf(id) < 0);
                dependencies = dependencies.concat(calcDependencies);
            }
            varRenderState.dependencies = dependencies;
            varList.push(varRenderState);
        }
        return this.kahnSortVars(varList);
    }

    /**
     *  Iterate through the variable (more precisely their renderstates) in an order
     *  that takes care of inter variable dependencies.
     *
     *  @param date the date at which the variables should be examined
     *  @param prvCtx the previous render context (not needed, might internally be used for optimizations later)
     *  @param renderCb get's called for each variable in the order of rendering
     *
     */
    public renderInOrder(date: string, prvCtx: FrameRenderContext | undefined, renderCb: (renderState: VariableRenderState) => any) {
        // populate the timesegments
        for (let varId in this.renderState) {
            this.renderState[varId].ts = this.renderState[varId].v.getTimeSegment(date);
        }

        for (let varRenderState of this.getVarsInRenderOrder()) {
            renderCb(varRenderState);
        }
    }

    constructor(public renderOrder: Variable[]) {
        renderOrder.forEach(v => this.renderState[v.id] = new VariableRenderState(v));
    }
}
