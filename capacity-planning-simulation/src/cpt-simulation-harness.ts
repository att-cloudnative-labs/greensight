import { CptEnvironmentIf, CptSimulationProcessIf, CptOutput, CptSimulationNodeIf, CptInformationPackage, genSimId } from './cpt-object';
import { CptGraphModel } from './cpt-graph-model';
import { GraphModel, SimulationConfiguration, SimulationScenario, SimulationNode, SimulationResult, SimulationNodeTypes, UidObject, Process, ProcessInport, ProcessOutport, NumberParam, HistogramAggeregate, SimulationNodeDataAggregate, SimulationNodeAggregatedReport, InportParam, NormalDistNumberParam, DataType, GraphParam, AggregationMethods, SimulationMessage, HistogramBucket, RawNodeDataEntry, AspectNumberParam, Aspect, AspectsAggregate, SimulationMessageRate, MessagesAggregate, AspectParam, ResponseNumberParam, ResponseAspectsAggregate, ResponseAspect } from '@cpt/capacity-planning-simulation-types';
import { Variable, VariableProjections, renderProjections, VariableType } from '@cpt/capacity-planning-projection';
import { scaleAspect, dupl } from './cpt-load-ops';
import { sampleNormal } from './cpt-math-ops';
import { buildProcessingElement } from './cpt-pe-repository';
import { isLatencyResponse, responseHistogramAggregation, mergeResponseAspect, flattenResponseAspect, responseSplitHistogramAggregation, getResponseSplitMean, flattenResponseAspectValue } from './cpt-response-ops';
import { CptDataAggregation } from './cpt-data-aggregation';

import { genMonths } from './cpt-date-ops';
import { map, reduce, switchMap, zip, concatAll, mergeMap } from 'rxjs/operators';
import { from, Subject, Observable, Observer, of } from 'rxjs';
import { SampleStat } from 'essy-stats';

type CptInportValueSet = { [portId: string]: InportParam };
type CptSimulationInportValueSet = { [date: string]: CptInportValueSet };
type CptBranchVariableSet = { [branchId: string]: Variable[] };

interface CptBranchVariableTuple {
    branch: string;
    variables: Variable[];
}



export type GraphModelLibrary = { [id: string]: { [version: string]: GraphModel } };

export class CptSimulationHarness implements CptEnvironmentIf {

    private graphModels: GraphModelLibrary;

    private simulationNodes: { [id: string]: SimulationNode } = {};
    // these are for storing breakdowns and slice
    // which are reported this way
    // we could think about putting warning in here as well
    private extraBreakdownNodes: { [id: string]: SimulationNode } = {};

    private curSimMonth: string;
    private curSimMonteCarloIteration?: number;
    private curSimScenarioId: string;

    constructor(private fetchBranchVariables: (branchId: string) => Promise<Variable[]>, private fetchModel: (id: string, version?: string) => Promise<GraphModel>, private logProgressImpl?: (any) => void) {

    }

    public logProgress(i: any) {
        if (this.logProgressImpl) {
            if (this.curSimMonteCarloIteration) {
                i = this.curSimMonteCarloIteration + ":" + i;
            }
            if (this.curSimMonth) {
                i = this.curSimMonth + ":" + i;
            }
            this.logProgressImpl(i);
        }
    }

    public findObject<T>(id: string): T {
        return null;
    }
    public findInstance<T>(id: string): T {
        return null;
    }

    private buildGraphModel(processConfiguration: Process, parent: CptSimulationProcessIf): CptGraphModel | Error {
        let gmDescription = this.graphModels[processConfiguration.ref]['latest'];
        if (gmDescription) {
            return new CptGraphModel(gmDescription, processConfiguration, parent);
        }

        return Error("no such graph model");
    }

    public buildProcess(processConfiguration: Process, parent: CptSimulationProcessIf): CptSimulationProcessIf | Error {

        switch (processConfiguration.type) {
            case 'PROCESSING_ELEMENT':
                return buildProcessingElement(processConfiguration, parent);
            case 'GRAPH_MODEL':
                return this.buildGraphModel(processConfiguration, parent);
            default:
                return Error("Unknown Process Type");
                break;
        }
    }

    public getCurrentSimulationDate(): string {
        return this.curSimMonth;
    }

    public load(procId: string): boolean {

        return false;
    }

    private getSubModelsIds(gm: GraphModel): string[] {
        let subIds: string[] = [];
        for (let procId in gm.processes) {
            let proc = gm.processes[procId];
            if (proc.type === 'GRAPH_MODEL') {
                subIds.push(proc.ref);
            }
        }
        return subIds;
    }

    private getNeededBranchIds(scenario: SimulationScenario): string[] {
        let forecastBranchId: string[] = [];
        for (let inportId in scenario.inports) {
            let inportParam = scenario.inports[inportId];
            if (inportParam.type === 'FORECAST_VAR_REF') {
                if (forecastBranchId.indexOf(inportParam.forecastId) < 0) {
                    forecastBranchId.push(inportParam.forecastId);
                }
            }
        }
        return forecastBranchId;
    }

    private getBranchVariables(fcBranchId: string): Observable<CptBranchVariableTuple> {

        return from(this.fetchBranchVariables(fcBranchId)).pipe(map<Variable[], CptBranchVariableTuple>(v => { return { branch: fcBranchId, variables: v }; }));

    }

    private projectBranches(bvs: CptBranchVariableSet, stepStart: string, stepLast: string): { [branchId: string]: VariableProjections } {
        let branchProjection: { [branchId: string]: VariableProjections } = {};
        for (let branchId in bvs) {
            let variables = bvs[branchId];
            let projection = renderProjections(variables, stepStart, stepLast);
            if (projection instanceof Error) {
                // todo handle err
            } else {
                branchProjection[branchId] = projection;
            }
        }
        return branchProjection;
    }

    private getVariableValue(variable: Variable, proj: VariableProjections, date: string): AspectParam | AspectNumberParam | Error {
        if (!proj) {
            return Error("no projection");
        }
        let variableId = variable.id;
        let varFrames = proj[variableId];
        if (varFrames) {
            for (let frame of varFrames) {
                if (frame.date === date) {
                    if (frame.distributionCalculationError === undefined && frame.frameDependencyError === undefined && frame.projectionCalculationError === undefined) {
                        if (frame.actualValue === undefined && frame.projectedValue === undefined) {
                            return {
                                type: 'ASPECT_NUMBER',
                                unit: frame.unit,
                                value: 0,
                                stdDev: 0,
                                aspects: []
                            };
                        } else if (variable.variableType === VariableType.Breakdown) {
                            let aspectParam: AspectParam = {
                                type: 'ASPECT',
                                value: {
                                    type: 'BREAKDOWN',
                                    name: variable.name,
                                    relative: true,
                                    slices: {}
                                }
                            };
                            for (let subFrame of frame.subFrames) {
                                aspectParam.value.slices[subFrame.name] = subFrame.value;
                            }
                            return aspectParam;
                        } else {
                            let rv: AspectNumberParam = {
                                type: 'ASPECT_NUMBER',
                                unit: frame.unit,
                                value: frame.actualValue !== undefined ? frame.actualValue : frame.projectedValue,
                                stdDev: frame.distribution !== undefined ? frame.distribution.stdDev : undefined,
                                aspects: []
                            }
                            if (frame.associatedBreakdowns !== undefined) {
                                for (let associatedBreakdown of frame.associatedBreakdowns) {
                                    let aspect: Aspect = {
                                        type: 'BREAKDOWN',
                                        relative: true,
                                        name: associatedBreakdown.name,
                                        slices: {}
                                    }
                                    for (let sliceName in associatedBreakdown.slices) {
                                        let slice = associatedBreakdown.slices[sliceName];
                                        aspect.slices[sliceName] = slice;
                                    }
                                    if (rv.aspects === undefined) {
                                        rv.aspects = [];
                                    }
                                    rv.aspects.push(aspect);
                                }
                            }
                            return rv;
                        }
                    }
                    break;
                }
            }
        }
        return Error("could not find variable value for " + variableId + ":" + date);
    }

    private getVariabeleFromBvs(bvs: CptBranchVariableSet, branchId: string, variableId: string): Variable {
        let variables = bvs[branchId];
        for (let v of variables) {
            if (v.id === variableId) {
                return v;
            }
        }
        return null;
    }
    private generateScenarioInputValues(scenario: SimulationScenario, stepStart: string, stepLast: string): Observable<CptSimulationInportValueSet> {
        let months = genMonths(stepStart, stepLast);
        let o$ = Observable.create((obs: Observer<CptSimulationInportValueSet>) => {
            from(this.getNeededBranchIds(scenario)).pipe(
                mergeMap(branchId => this.getBranchVariables(branchId)),
                reduce<CptBranchVariableTuple, CptBranchVariableSet>((acc, next) => { acc[next.branch] = next.variables; return acc }, {})
            ).subscribe(bvs => {
                let sivs: CptSimulationInportValueSet = {};
                let branchProjection = this.projectBranches(bvs, stepStart, stepLast);
                for (let month of months) {
                    let ivs: CptInportValueSet = {};
                    for (let inportId in scenario.inports) {
                        let inportParam = scenario.inports[inportId];
                        if (inportParam.type !== 'FORECAST_VAR_REF') {
                            ivs[inportId] = inportParam;
                        } else {
                            let variable = this.getVariabeleFromBvs(bvs, inportParam.forecastId, inportParam.variableId);
                            let fcInportParam = this.getVariableValue(variable, branchProjection[inportParam.forecastId], month);
                            if (fcInportParam instanceof Error) {
                                obs.error(fcInportParam);
                            } else {
                                ivs[inportId] = fcInportParam;
                            }
                        }
                    }
                    sivs[month] = ivs;
                }
                obs.next(sivs);
                obs.complete();
            }, err => { obs.error(err); });
        });
        return o$;
    }

    private recursivelyFetchGraphModels(graphModelId: string, version?: string): Observable<GraphModelLibrary> {
        version = 'latest';

        let ms = new Subject<GraphModel>();
        let gms: GraphModelLibrary = {};
        let pending: string[] = [];
        let o$ = Observable.create((obs: Observer<GraphModelLibrary>) => {
            ms.subscribe(gm => {
                // no proper version handling here
                if (gms[gm.objectId] === undefined || gms[gm.objectId][version] === undefined) {
                    gms[gm.objectId] = {};
                    gms[gm.objectId][version] = gm;
                }
                let subIds = this.getSubModelsIds(gm);
                for (let subId of subIds) {
                    if (gms[subId] === undefined || pending.indexOf(subId) < 0) {
                        pending.push(subId);
                        from(this.fetchModel(subId)).subscribe(subgm => { ms.next(subgm); }, err => { ms.error(err); });
                    }
                }
                pending = pending.filter(id => id !== gm.objectId);
                if (!pending.length) {
                    ms.complete();
                }
            }, err => {
                obs.error(err);
            }, () => {
                obs.next(gms);
                obs.complete();
            });;

            pending.push(graphModelId);
            from(this.fetchModel(graphModelId)).subscribe(gm => { ms.next(gm); }, err => { ms.error(err); });
        });

        return o$;
    }

    private getSingleScenario(scenarios: { [scenarioId: string]: SimulationScenario }): SimulationScenario {
        for (let scenarioId in scenarios) {
            return scenarios[scenarioId];
        }
        return null;
    }

    private runSingleScenario(c: SimulationConfiguration, scenario: SimulationScenario, rootModel: CptGraphModel): Observable<string> {
        this.logProgress("running scenario " + scenario.objectId);
        let o$ = Observable.create((obs: Observer<string>) => {
            this.curSimScenarioId = scenario.objectId;
            this.generateScenarioInputValues(scenario, c.stepStart, c.stepLast).subscribe(scenarioInputValues => {
                try {
                    this.logProgress("fetched all input values");
                    let months = genMonths(c.stepStart, c.stepLast);

                    for (let month of months) {
                        // always run a simple means simulation
                        this.curSimMonteCarloIteration = undefined;
                        this.curSimMonth = month;
                        this.runSimulation(rootModel, this.monteCarloSample(scenarioInputValues[month], true), month);
                        // run some monte caro iterations if asked
                        if (c.monteCarloIterations !== undefined && c.monteCarloIterations > 0) {
                            for (let i = 0; i < c.monteCarloIterations; i++) {
                                this.curSimMonteCarloIteration = i;
                                this.runSimulation(rootModel, this.monteCarloSample(scenarioInputValues[month]), month, i);
                            }
                        }
                    }

                    obs.next(scenario.objectId);
                    obs.complete();

                } catch (e) {
                    this.logProgress("trouble while running simulation: " + e);
                    return obs.error("simulation problems")
                }


            }, err => {
                return obs.error("failed to calculate inport values " + err);
            });
        });
        return o$;
    }

    public runSimulationConfiguration(c: SimulationConfiguration): Promise<SimulationResult> {
        this.simulationNodes = {};
        let p = new Promise<SimulationResult>((resolve, reject) => {
            this.recursivelyFetchGraphModels(c.modelRef, c.modelVersion).subscribe(gml => {
                this.logProgress("fetched all models");
                this.graphModels = gml;

                let sr: SimulationResult = {
                    objectId: 'result-id',
                    objectType: 'SIMULATION_RESULT',
                    state: 'DONE',
                    simulationConfigurationId: c.objectId,
                    simulationConfigurationVersion: '?',
                    stepStart: c.stepStart,
                    stepLast: c.stepLast,
                    queuedAt: new Date().toString(),
                    ranAt: new Date().toString(),
                    finishedAt: new Date().toString(),
                    nodes: {},
                    scenarios: {}
                }
                //of(c.scenarios).pipe(map(scenMap => this.getSingleScenario(scenMap)), switchMap(scenario => this.runSingleScenario(c, scenario.objectId))).subscribe(o => { }, e => { reject(e) }, () => {
                let scenarios: SimulationScenario[] = [];
                for (let scId in c.scenarios) {
                    scenarios.push(c.scenarios[scId]);
                }

                let rootGraphModelDescription = this.graphModels[c.modelRef]['latest'];
                let rootProcess = this.generateRootProcess(rootGraphModelDescription);
                let rootModel = new CptGraphModel(rootGraphModelDescription, rootProcess);
                this.logProgress("initializing root model");
                if (!rootModel.init(this)) {
                    return reject("failed to inialize root model");
                }

                from(scenarios).pipe(map(scenario => this.runSingleScenario(c, scenario, rootModel)), concatAll()).subscribe(o => { }, e => { reject(e) }, () => {

                    let months = genMonths(c.stepStart, c.stepLast);
                    let dataAggregation = new CptDataAggregation(this.simulationNodes, scenarios, months);
                    let allSimulationNodes = dataAggregation.compute();

                    sr.nodes = allSimulationNodes;
                    sr.finishedAt = new Date().toString();
                    resolve(sr);

                });
            });
        });
        return p;
    }

    private runSimulation(rootModel: CptGraphModel, inportValues: CptInportValueSet, date: string, mcIteration?: number) {
        this.logProgress("run simulation " + date);
        rootModel.reset();
        for (let inportId in inportValues) {
            rootModel.acceptLoad(inportValues[inportId], inportId);
        }
        rootModel.process();
        rootModel.processResponse();
    }

    private monteCarloSample(inportValueSet: CptInportValueSet, mean?: boolean): CptInportValueSet {
        let mcValueSet: CptInportValueSet = {};
        for (let inportId in inportValueSet) {
            let inportParam = inportValueSet[inportId];
            if (inportParam.type === 'ASPECT_NUMBER') {
                let aspectParam = {
                    type: 'ASPECT_NUMBER',
                    value: inportParam.value,
                    unit: inportParam.unit
                } as AspectNumberParam;
                if (inportParam.stdDev && !mean) {
                    aspectParam.value = sampleNormal(inportParam.value, inportParam.stdDev);
                }
                if (inportParam.aspects) {
                    for (let aspect of inportParam.aspects) {
                        // only supporting relative breakdowns for now
                        // these are generated by the FC projection
                        // make an absolute breakdown out of it
                        if (aspect.relative && aspect.type === 'BREAKDOWN') {
                            let absoluteAspect: Aspect = {
                                type: 'BREAKDOWN',
                                name: aspect.name,
                                relative: false,
                                slices: {}
                            }
                            for (let sliceName in aspect.slices) {
                                let relativeSlice = aspect.slices[sliceName];
                                absoluteAspect.slices[sliceName] = relativeSlice * Math.abs(aspectParam.value);
                            }
                            if (aspectParam.aspects === undefined) {
                                aspectParam.aspects = [];
                            }
                            aspectParam.aspects.push(absoluteAspect);
                        }
                    }
                }
                mcValueSet[inportId] = aspectParam;
            } else {
                mcValueSet[inportId] = inportParam;
            }
        }

        return mcValueSet;
    }

    // for uniformity we put our graph model under test in
    // a process structure
    private generateRootProcess(gm: GraphModel): Process {
        let p: Process = {
            objectType: 'PROCESS',
            objectId: 'root',
            type: 'GRAPH_MODEL',
            ref: gm.objectId,
            label: gm.label || "Root Model",
            inports: {},
            outports: {}
        };
        for (let gipId in gm.inports) {
            let gip = gm.inports[gipId];
            let pip: ProcessInport = {
                objectId: gipId,
                objectType: 'PROCESS_INPORT',
                ref: gipId
            }
            p.inports[pip.objectId] = pip;
        }
        for (let gopId in gm.outports) {
            let gop = gm.inports[gopId];
            let pop: ProcessOutport = {
                objectId: gopId,
                objectType: 'PROCESS_OUTPORT',
                ref: gopId
            }
            p.outports[pop.objectId] = pop;
        }

        return p;
    }

    public storeRawData(sender: CptSimulationNodeIf, data: GraphParam | SimulationMessage) {
        let simulationNode = this.simulationNodes[sender.simulationNodeId];
        if (simulationNode) {
            let raw: RawNodeDataEntry = {
                scenarioId: this.curSimScenarioId,
                stepDate: this.curSimMonth,
                mcRun: this.curSimMonteCarloIteration,
                data: JSON.parse(JSON.stringify(data))
            };
            if (simulationNode.rawData === undefined) {
                simulationNode.rawData = [];
            }
            simulationNode.rawData.push(raw);
        }
    }
    public storeRawResponse(sender: CptSimulationNodeIf, data: GraphParam) {
        let simulationNode = this.simulationNodes[sender.simulationNodeId];
        if (simulationNode) {
            let raw: RawNodeDataEntry = {
                scenarioId: this.curSimScenarioId,
                stepDate: this.curSimMonth,
                mcRun: this.curSimMonteCarloIteration,
                data: JSON.parse(JSON.stringify(data))
            };
            if (simulationNode.rawResponses === undefined) {
                simulationNode.rawResponses = [];
            }
            simulationNode.rawResponses.push(raw);
        }

    }


    public registerSimulationNode(node: CptSimulationNodeIf, parent?: CptSimulationNodeIf, children?: CptSimulationNodeIf[]) {
        let sn: SimulationNode = {
            objectId: node.simulationNodeId,
            objectType: 'SIMULATION_NODE',
            type: node.nodeType,
            parentInstanceId: parent ? parent.simulationNodeId : undefined,
            subNodeInstanceIds: children ? children.map(c => c.simulationNodeId) : undefined,
            processNodeId: node.processNodeId,
            ref: node.ref,
            name: node.label,
            aggregationMethods: []
        }
        this.simulationNodes[node.simulationNodeId] = sn;
    }

    public registerInstance<T>(id: string, instance: T) {

    }
    public log(sender: CptSimulationNodeIf, i: any) {

    }
    public warn(sender: CptSimulationNodeIf, i: any, blank?: boolean) {
        this.storeRawData(sender, {
            type: 'WARNING',
            name: i as string,
            blank: blank
        });
    }
    public error(sender: CptSimulationNodeIf, i: any, blank?: boolean, fatal?: boolean) {
        this.storeRawData(sender, {
            type: 'ERROR',
            name: i as string,
            blank: blank
        });
        //TODO: handle fatal
    }
    public output(sender: CptSimulationProcessIf, o: CptOutput) {

    }
}
