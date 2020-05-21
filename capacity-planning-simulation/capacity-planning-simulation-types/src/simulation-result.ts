import { SimulationScenario } from './simulation-configuration';
import { GraphParam, ResponseParam } from './graph';
import { Aspect, ResponseAspect } from './param';
import { UidObject, NodeTypes } from './object';
import { SimulationRuntimeMessage } from "./simulation-runtime-message";



export type SimulationState = 'QUEUED' | 'RUNNING' | 'FAILED' | 'DONE';


export interface HistogramBucket {
    min: number;
    max: number;
    count: number;
}

export interface SimulationMessage {
    type: 'ERROR' | 'WARNING' | 'INFO',
    name: string,
    blank?: boolean
}

export interface SimulationMessageRate extends SimulationMessage {
    rate: number
}

export interface HistogramAggregate {
    type: 'HISTOGRAM';
    buckets: HistogramBucket[];
    unit?: string;
}

export interface AspectsAggregate {
    type: 'ASPECTS';
    values: Aspect[];
}

export interface ResponseAspectsAggregate {
    type: 'RESPONSE_ASPECTS';
    values: ResponseAspect[];
}


export interface MessagesAggregate {
    type: 'MESSAGES';
    values: SimulationMessageRate[]
}

export interface RateAggregate {
    type: 'RATE';
    value: number;
}

export type Aggregate = GraphParam | HistogramAggregate | AspectsAggregate | MessagesAggregate | ResponseAspectsAggregate | RateAggregate;

export type SimulationNodeDataAggregate = { [method in AggregationMethods]: Aggregate };

// TODO: define this
export type SimulationNodeResponseAggregate = SimulationNodeDataAggregate;

export interface SimulationNodeAggregatedReport {
    data?: SimulationNodeDataAggregate,
    response?: SimulationNodeResponseAggregate
}


export type SimulationNodeTypes = NodeTypes;
export type AggregationMethods = 'AVG' | 'MIN' | 'MAX' | 'NINETIETH' | 'NINETIEFIFTH' | 'NINETIENINTH' | 'HISTOGRAM' | 'ASPECTS' | 'MESSAGES' | 'RESPONSE_ASPECTS' | 'RATE';

export interface RawNodeDataEntry {
    scenarioId: string,
    stepDate: string,
    mcRun?: number,
    data: GraphParam | ResponseParam | SimulationMessage
}


// a simulation node represents entities in the simulation
// that output data.
export interface SimulationNode extends UidObject {
    // from UidObject
    objectId: string;
    objectType: 'SIMULATION_NODE';

    type: SimulationNodeTypes;

    // parent instance reference. not set for root
    parentInstanceId?: string;
    // sub node instance reference. not set if no subnodes
    subNodeInstanceIds?: string[];
    // the id of the node inside the process
    processNodeId?: string;
    // reference to the basegraph model or processing element
    ref?: string;
    releaseNr?: number;
    // display name
    name?: string;

    warnings?: SimulationRuntimeMessage[];


    // all methods for data aggregation that
    // are available at any scenario/step date in the
    // aggregated report
    aggregationMethods?: AggregationMethods[];
    // for now there will be only a single scenario id so just take
    // the 1st entry.
    aggregatedReport?: { [scenarioId: string]: { [stepDate: string]: SimulationNodeAggregatedReport } };

    rawData?: RawNodeDataEntry[];
    rawResponses?: RawNodeDataEntry[];
}


export interface SimulationResult extends UidObject {
    // from UidObject
    objectId: string;
    objectType: 'SIMULATION_RESULT';

    // metadata to save display settings
    // this will include nodes selected for display
    metadata?: any;
    state: SimulationState;
    // it state is FAILED  error is set.
    error?: string;
    errorDetails?: SimulationRuntimeMessage;

    warnings?: SimulationRuntimeMessage[];

    // reference to the simulation configuration
    // you could pull the scenarios from there
    simulationConfigurationId: string;
    simulationConfigurationVersion: string;

    // first simulation step date to be simulated
    stepStart: string;
    // last simulation step date to be simulated
    stepLast: string;


    // simulation execution information:
    // the time the simulation request was queued
    queuedAt: string;
    // the time the simulation actually got started
    ranAt?: string;
    // the time the simulation was done or failed
    finishedAt?: string;


    nodes: { [nodeInstanceId: string]: SimulationNode };

    scenarios: { [scenarioId: string]: SimulationScenario };
}
