import { CptEnvironmentIf, CptOutput, CptSimError, CptSimulationNodeIf, CptSimulationProcessIf } from './cpt-object';
import { CptGraphModel } from './cpt-graph-model';
import {
    Aspect,
    GraphModel,
    GraphParam,
    InportParam,
    Process,
    ProcessInport,
    ProcessOutport,
    RawNodeDataEntry,
    SimulationConfiguration,
    SimulationMessage,
    SimulationNode,
    SimulationResult,
    SimulationScenario
} from '@cpt/capacity-planning-simulation-types';
import { Variable, VariableProjections } from '@cpt/capacity-planning-projection';
import { hasAspect, isAspectNumber, isRandomNumber, isVarRef, makeBreakdownRelative } from './cpt-load-ops';
import { meanValue, sampleValue } from './cpt-math-ops';
import { buildProcessingElement } from './cpt-pe-repository';
import { CptDataAggregation } from './cpt-data-aggregation';

import { genMonths } from './cpt-date-ops';
import { NumberParam, ReleaseTrackingUidObject, ResponseParam, SimulationMessageCode } from "@cpt/capacity-planning-simulation-types";
import { CptSheetOps } from "./cpt-sheet-ops";
import { SimulationRuntimeMessage, SimulationStage } from "@cpt/capacity-planning-simulation-types/lib";


type CptSimulationInputValueSet = { [portId: string]: InportParam };
type CptInportValueSet = { [portId: string]: GraphParam };
type CptSimulationInputValueSeries = { [date: string]: CptSimulationInputValueSet };
export type SheetVariableLibrary = { [sheetId: string]: { [version: string]: Variable[] } };
export type SheetProjectionLibrary = { [sheetId: string]: { [version: string]: VariableProjections } };


export type GraphModelLibrary = { [id: string]: { [version: string]: GraphModel } };
export type VersionedDependency = { id: string, version?: string, name?: string };

export class CptSimulationHarness implements CptEnvironmentIf {

    private graphModels: GraphModelLibrary;

    private simulationNodes: { [id: string]: SimulationNode } = {};

    private curSimMonth: string;
    private curSimMonteCarloIteration?: number;
    private curSimScenarioId: string;
    private curRuntimeStage: SimulationStage;


    private runtimeWarnings: SimulationRuntimeMessage[] = [];

    constructor(private fetchSheetVariables: (id: string, version?: string) => Promise<{ version: string, variables: Variable[] }>, private fetchModel: (id: string, version?: string) => Promise<{ version: string, gm: GraphModel }>, private logProgressImpl?: (any) => void) {

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

    private execStack: { nodeId: string, name: string }[] = [];

    public pushExecStack(node: CptSimulationNodeIf) {
        this.execStack.push({ nodeId: node.simulationNodeId, name: node.label });
    }
    public popExecStack() {
        this.execStack.pop();
    }

    private buildGraphModel(processConfiguration: Process, parent: CptSimulationProcessIf): CptGraphModel | Error {
        let gmDescription = this.graphModels[processConfiguration.ref][processConfiguration.versionId];
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
        }
    }

    public getCurrentSimulationDate(): string {
        return this.curSimMonth;
    }

    public load(procId: string): boolean {

        return false;
    }

    // also patches the version id (:
    private static getSubModelsIds(gm: GraphModel): VersionedDependency[] {
        let subIds: VersionedDependency[] = [];
        for (let procId in gm.processes) {
            let proc = gm.processes[procId];
            if (proc.type === 'GRAPH_MODEL') {
                const v = CptSimulationHarness.getReferenceTrackingVersion(proc);
                proc.versionId = v;
                subIds.push({ id: proc.ref, version: v, name: proc.name });
            }
        }
        return subIds;
    }


    public static getReferenceTrackingVersion(trackingRef: ReleaseTrackingUidObject): string {
        if (trackingRef.tracking === 'CURRENT_VERSION' || !trackingRef.releaseNr) {
            return 'latest';
        } else {
            return `r${trackingRef.releaseNr}`;
        }
    }

    private async generateScenarioInputValues(conf: SimulationConfiguration, scenario: SimulationScenario, stepStart: string, stepLast: string): Promise<CptSimulationInputValueSeries> {
        const months = genMonths(stepStart, stepLast);
        const svl: SheetVariableLibrary = {};
        const neededSheets = CptSheetOps.getNeededSheetDeps(conf, scenario);
        for (const sheetDep of neededSheets) {
            if (!svl[sheetDep.id]) {
                svl[sheetDep.id] = {}
            }
            if (!svl[sheetDep.id][sheetDep.version]) {
                try {
                    const sheet = await this.fetchSheetVariables(sheetDep.id, sheetDep.version);
                    svl[sheetDep.id][sheetDep.version] = sheet.variables;
                } catch (e) {
                    if (e.hasOwnProperty('statusCode')) {
                        if (e.statusCode === 500) {
                            throw new CptSimError('FORECAST_SHEET_MISSING', 'failed to fetch graph model \'' + sheetDep.name + '\'');
                        } else if (e.statusCode === 410) {
                            throw new CptSimError('FORECAST_SHEET_TRASHED', 'failed to fetch forecast sheet \'' + sheetDep.name + '\' because it is trashed');
                        }
                    }
                }

            }
        }
        const sivs: CptSimulationInputValueSeries = {};
        const sheetProjectionLibrary = CptSheetOps.projectSheets(svl, stepStart, stepLast);
        for (const month of months) {
            let ivs: CptSimulationInputValueSet = {};
            for (let inportId in scenario.inports) {
                let inportParam = scenario.inports[inportId];
                if (!isVarRef(inportParam)) {
                    ivs[inportId] = inportParam;
                } else {
                    const sheetRef = conf.forecasts[inportParam.sheetRefId];
                    const sheetVersion = CptSimulationHarness.getReferenceTrackingVersion(sheetRef);
                    let variable = CptSheetOps.getVariableFromProjections(svl, sheetRef.ref, sheetVersion, inportParam.variableId);
                    const sheetProjection = sheetProjectionLibrary[sheetRef.ref][sheetVersion];
                    let fcInportParam = CptSheetOps.getVariableValue(variable, sheetProjection, month);
                    if (fcInportParam instanceof Error) {
                        throw fcInportParam;
                    } else {
                        ivs[inportId] = fcInportParam;
                    }
                }
            }
            sivs[month] = ivs;
        }
        return sivs;
    }

    private async _recursivelyFetchGraphModels(graphModelId: string, gmVersion: string, gml: GraphModelLibrary, gmName: string) {
        console.log("fetching " + graphModelId + "@" + gmVersion);
        const subIds: VersionedDependency[] = [];
        try {
            const versionedGm = await this.fetchModel(graphModelId, gmVersion);
            subIds.push(...CptSimulationHarness.getSubModelsIds(versionedGm.gm));
            if (!gml[graphModelId]) {
                gml[graphModelId] = {};
            }
            if (!gml[graphModelId][gmVersion]) {
                gml[graphModelId][gmVersion] = versionedGm.gm;
            }
        } catch (e) {
            if (e.hasOwnProperty('statusCode')) {
                if (e.statusCode === 500) {
                    throw new CptSimError('GRAPH_MODEL_MISSING', 'failed to fetch graph model \'' + gmName + '\'');
                } else if (e.statusCode === 410) {
                    throw new CptSimError('GRAPH_MODEL_TRASHED', 'failed to fetch graph model \'' + gmName + '\' because it is trashed');
                }
            }
            throw e;
        }

        for (const subDep of subIds) {
            if (!gml[subDep.id] || !gml[subDep.id][subDep.version]) {
                await this._recursivelyFetchGraphModels(subDep.id, subDep.version, gml, subDep.name);
            }
        }
    }

    private async recursivelyFetchGraphModels(graphModelId: string, gmVersion: string, gmName: string): Promise<GraphModelLibrary> {
        let gml: GraphModelLibrary = {};
        await this._recursivelyFetchGraphModels(graphModelId, gmVersion, gml, gmName);
        return gml;
    }

    private async runSingleScenario(c: SimulationConfiguration, scenario: SimulationScenario, rootModel: CptGraphModel) {
        this.logProgress("running scenario " + scenario.objectId);
        this.curSimScenarioId = scenario.objectId;
        const scenarioInputValues = await this.generateScenarioInputValues(c, scenario, c.stepStart, c.stepLast);
        try {
            this.logProgress("fetched all input values");
            let months = genMonths(c.stepStart, c.stepLast);

            for (let month of months) {
                // always run a simple means simulation
                this.curSimMonteCarloIteration = undefined;
                this.curSimMonth = month;
                // run some monte carlo iterations if asked
                if (c.monteCarloIterations !== undefined && c.monteCarloIterations > 0) {
                    for (let i = 0; i < c.monteCarloIterations; i++) {
                        this.curSimMonteCarloIteration = i;
                        this.runSimulation(rootModel, CptSimulationHarness.monteCarloSample(scenarioInputValues[month]), month, i);
                    }
                } else {
                    this.runSimulation(rootModel, CptSimulationHarness.monteCarloSample(scenarioInputValues[month], true), month);
                }
            }
        } catch (e) {
            this.logProgress("trouble while running simulation: " + JSON.stringify(e));
            throw e;
        }
    }

    public async runSimulationConfiguration(c: SimulationConfiguration, sr: SimulationResult): Promise<void> {
        this.simulationNodes = {};
        this.curRuntimeStage = 'SETUP';
        try {
            const rootVersionId = CptSimulationHarness.getReferenceTrackingVersion(c);
            const gml = await this.recursivelyFetchGraphModels(c.ref, rootVersionId, c.modelName ? c.modelName : 'root');
            this.logProgress("fetched all models");
            this.graphModels = gml;

            sr.state = 'RUNNING';

            let scenarios: SimulationScenario[] = [];
            for (let scId in c.scenarios) {
                scenarios.push(c.scenarios[scId]);
            }

            const rootGraphModelDescription = this.graphModels[c.ref][rootVersionId];
            const rootProcess = CptSimulationHarness.generateRootProcess(rootGraphModelDescription, rootVersionId);
            const rootModel = new CptGraphModel(rootGraphModelDescription, rootProcess);
            this.logProgress("initializing root model");
            if (!rootModel.init(this)) {
                sr.state = 'FAILED';
                sr.error = 'graph model init failed';
                sr.errorDetails = {
                    stage: 'SETUP',
                    code: 'MODEL_INITIALIZATION_FAILED'
                };
                return Promise.reject("failed to initialize root model");
            }
            this.curRuntimeStage = 'SIMULATION';
            for (const scenario of scenarios) {
                await this.runSingleScenario(c, scenario, rootModel);
            }

            let months = genMonths(c.stepStart, c.stepLast);
            this.curRuntimeStage = 'AGGREGATION';
            let dataAggregation = new CptDataAggregation(this.simulationNodes, scenarios, months);
            sr.nodes = dataAggregation.compute();
            sr.finishedAt = new Date().toString();
            sr.warnings = this.runtimeWarnings;
            sr.state = 'DONE';
        } catch (e) {
            sr.finishedAt = new Date().toString();
            sr.state = 'FAILED';
            sr.warnings = this.runtimeWarnings;
            sr.error = e.message;
            const stackCopy = JSON.parse(JSON.stringify(this.execStack));
            const causedBy = this.execStack.pop();
            sr.errorDetails = {
                code: e.hasOwnProperty('code') ? e.code : 'EXCEPTION',
                stage: this.curRuntimeStage,
                stack: stackCopy,
                nodeId: causedBy ? causedBy.nodeId : null
            }
        }
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

    private static monteCarloSample(inportValueSet: CptSimulationInputValueSet, mean?: boolean): CptInportValueSet {
        let mcValueSet: CptInportValueSet = {};
        for (let inportId in inportValueSet) {
            let inportParam = inportValueSet[inportId];
            if (isAspectNumber(inportParam)) {
                let aspectParam = {
                    type: 'NUMBER',
                    value: inportParam.value,
                    unit: inportParam.unit
                } as NumberParam;
                if (inportParam.aspects) {
                    for (let aspect of inportParam.aspects) {
                        // only supporting relative breakdowns for now
                        // these are generated by the FC projection
                        // make an absolute breakdown out of it
                        if (aspect.relative) {
                            let absoluteAspect: Aspect = {
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
            } else if (isRandomNumber(inportParam)) {
                const randomSampleAspects: Aspect[] = [];
                if (hasAspect(inportParam)) {
                    for (const aspect of inportParam.aspects) {
                        randomSampleAspects.push(makeBreakdownRelative(aspect));
                    }
                }
                mcValueSet[inportId] = {
                    type: 'NUMBER',
                    unit: inportParam.unit,
                    value: mean ? meanValue(inportParam) : sampleValue(inportParam),
                    aspects: randomSampleAspects
                } as NumberParam;
            } else {
                mcValueSet[inportId] = inportParam;
            }
        }

        return mcValueSet;
    }

    // for uniformity we put our graph model under test in
    // a process structure
    private static generateRootProcess(gm: GraphModel, releaseNr: string): Process {
        let p: Process = {
            objectType: 'PROCESS',
            objectId: 'root',
            type: 'GRAPH_MODEL',
            ref: gm.objectId,
            label: gm.label || "Root Model",
            inports: {},
            outports: {},
            name: 'root'
        };
        if (releaseNr && releaseNr.startsWith('r')) {
            p.releaseNr = parseInt(releaseNr.slice(1));
        }
        for (const gipId in gm.inports) {
            const pip: ProcessInport = {
                objectId: gipId,
                objectType: 'PROCESS_INPORT',
                ref: gipId
            };
            p.inports[pip.objectId] = pip;
        }
        for (const gopId in gm.outports) {
            const pop: ProcessOutport = {
                objectId: gopId,
                objectType: 'PROCESS_OUTPORT',
                ref: gopId
            };
            p.outports[pop.objectId] = pop;
        }

        return p;
    }

    public storeRawData(sender: CptSimulationNodeIf, data: GraphParam | SimulationMessage | ResponseParam[]) {
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
    public storeRawResponse(sender: CptSimulationNodeIf, data: ResponseParam[]) {
        let simulationNode = this.simulationNodes[sender.simulationNodeId];
        if (simulationNode) {
            for (const dataEntry of data) {
                let raw: RawNodeDataEntry = {
                    scenarioId: this.curSimScenarioId,
                    stepDate: this.curSimMonth,
                    mcRun: this.curSimMonteCarloIteration,
                    data: JSON.parse(JSON.stringify(dataEntry))
                };
                if (simulationNode.rawResponses === undefined) {
                    simulationNode.rawResponses = [];
                }
                simulationNode.rawResponses.push(raw);
            }
        }
    }


    public registerSimulationNode(node: CptSimulationNodeIf, parent?: CptSimulationNodeIf, children?: CptSimulationNodeIf[]) {
        this.simulationNodes[node.simulationNodeId] = {
            objectId: node.simulationNodeId,
            objectType: 'SIMULATION_NODE',
            type: node.nodeType,
            parentInstanceId: parent ? parent.simulationNodeId : undefined,
            subNodeInstanceIds: children ? children.map(c => c.simulationNodeId) : undefined,
            processNodeId: node.processNodeId,
            ref: node.ref,
            releaseNr: node.releaseNr,
            name: node.label,
            aggregationMethods: []
        };
    }

    public registerInstance<T>(id: string, instance: T) {

    }
    public log(sender: CptSimulationNodeIf, i: any) {

    }

    // simulation time warnings are store with the simulation nodes
    public warn(sender: CptSimulationNodeIf, code: SimulationMessageCode, desc?: string, inhibitDeduplication?: boolean) {
        let simulationNode = this.simulationNodes[sender.simulationNodeId];
        if (simulationNode) {
            const hazWarning = () => {
                const nodeWarnings = simulationNode.warnings;
                if (nodeWarnings) {
                    return !!nodeWarnings.find(w => w.nodeId === sender.simulationNodeId && w.code === code && w.desc === desc);
                } else {
                    return false;
                }
            };
            if (!hazWarning() || inhibitDeduplication) {
                const warningMessage = {
                    code: code,
                    nodeId: sender.simulationNodeId,
                    stage: "SIMULATION",
                    stack: JSON.parse((JSON.stringify(this.execStack))),
                    date: this.curSimMonth,
                    scenarioId: this.curSimScenarioId,
                    desc: desc
                } as SimulationRuntimeMessage;

                const nodeWarnings = simulationNode.warnings ? simulationNode.warnings : simulationNode.warnings = [];
                nodeWarnings.push(warningMessage);
            }
        }
    }
    public output(sender: CptSimulationProcessIf, o: CptOutput) {

    }
}
