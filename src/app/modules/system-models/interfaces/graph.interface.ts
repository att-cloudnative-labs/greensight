// TODO: Load these from @cpt/capacity-planning-simulation-types instead

// TODO: Once typescript 3.4 comes out we can do this to eliminate duplication
/*
export const ALL_PARAM_TYPES = ['NUMBER', 'STRING', 'BOOLEAN', 'BREAKDOWN'] as const;
type ParamTypeTuple = typeof ALL_PARAM_TYPES;
export type ParamType = ParamTypeTuple[number];
*/

export const ALL_PARAM_TYPES = ['NUMBER', 'STRING', 'BOOLEAN', 'BREAKDOWN', 'DATE'];
export type ParamType = 'NUMBER' | 'STRING' | 'BOOLEAN' | 'BREAKDOWN' | 'DATE' | 'DEFAULT';

export const ALL_CONFIG_TYPES = ['NUMBER', 'STRING', 'BOOLEAN'];
export type ConfigType = 'NUMBER' | 'STRING' | 'BOOLEAN';


export interface DefaultParam {
    type: Default;
    value: any;
}

export interface Default {
    type: any;
}
export interface NumberParam {
    type: 'NUMBER';
    value: number;
    unit?: string;
}

export interface StringParam {
    type: 'STRING';
    value: string;
    unit?: string;
}

export interface BooleanParam {
    type: 'BOOLEAN';
    value: boolean;
    unit?: string;
}

export interface DateParam {
    type: 'DATE';
    value: Date;
}


export interface Aspect {
    type: 'BREAKDOWN';
    name: string;
    relative?: boolean;
    slices: {
        [label: string]: number;
    };
}

export interface AspectParam {
    type: 'ASPECT';
    value: Aspect;
}

export type GraphParam = AspectParam | NumberParam | StringParam | BooleanParam | DateParam | DefaultParam;
export type GraphConfig = NumberParam | StringParam | BooleanParam;
export type GeneratesResponseTypes = 'ALWAYS' | 'NEVER' | 'PASSTHROUGH';
export type ProcessTypes = 'PROCESSING_ELEMENT' | 'GRAPH_MODEL';


// an inport (:
export interface Inport {
    name: string;
    // hard requirements on parameters
    requiredTypes: ParamType[];
    desiredUnits: string[];
    generatesResponse: GeneratesResponseTypes;
    metadata?: any;
    // sets param on ProcessInport by default
    defaultParam?: GraphParam;
    // hint what configuration will be expected
    // for dynamic ports
    configType?: ConfigType;
}


// an outport (:
// configType is used for configurable dynamic outports
export interface Outport {
    name: string;
    types: ParamType[]; // we might not know the type!
    unit?: string;
    metadata?: any;
    // hint what configuration will be expected
    // for dynamic ports
    configType?: ConfigType;
}


// quick description of all things needed
// to use a process inside a graph model
export interface ProcessInterfaceDescription {
    name: string;
    inports: { [id: string]: Inport };
    // for dynamic inports specifiy templates here
    inportTemplates: { [id: string]: Inport };
    outports: { [id: string]: Outport };
    // for dynamic outports specifiy templates here
    outportTemplates: { [id: string]: Outport };
}

// reference an outport for a process
// from it's definition space
export interface ProcessOutport {
    ref: string;
    // apply configuration to dynamic ports
    config?: GraphParam;
}

// reference an inport for a process from it's definition space
export interface ProcessInport {
    ref: string;
    // apply configuration to dynamic ports
    config?: GraphConfig;
    // apply parameters to the inport
    param?: GraphParam;
}

// each external active element inside a graph
// is represented by a process.
// all the process ports get a graph specific UUID and will
// reference the Processes Port ID internally
export interface Process {
    type: ProcessTypes;
    ref: string;
    // if not set assume latest
    version?: string;
    label?: string;
    metadata?: any;
    inports?: { [id: string]: ProcessInport };
    outports?: { [id: string]: ProcessOutport };
}


// a connection is defined by two ports.
export interface Connection {
    // id of source port
    source: string;
    // id of destination port
    destination: string;
    metadata?: any;
}

// defining a graph model
// all IDs are UUIDs
export interface GraphModel {
    inports: { [id: string]: Inport };
    outports: { [id: string]: Outport };
    processes: { [id: string]: Process };
    connections: { [id: string]: Connection };
    metadata?: any;
}


// representing a graph model in the
// tree
export interface GraphModelNode {
    name: string;
    content: GraphModel;
}
