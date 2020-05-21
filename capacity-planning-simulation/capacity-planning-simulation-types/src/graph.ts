import {
    ParamType,
    ConfigType,
    AspectParam,
    NumberParam,
    StringParam,
    BooleanParam,
    DateParam,
    ResponseNumberParam,
    ResponseDummyParam
} from './param';
import { Process } from './process';
import { UidObject } from './object';

export type GraphParam = AspectParam | NumberParam | StringParam | BooleanParam | DateParam | ResponseNumberParam;
export type ResponseParam = ResponseNumberParam | ResponseDummyParam;
export type GraphConfig = NumberParam | StringParam | BooleanParam;
export type GeneratesResponseTypes = 'ALWAYS' | 'NEVER' | 'PASSTHROUGH';


export interface Port {
    name: string;
    metadata?: any;
    description?: string;

    // hint what configuration will be expected
    // for dynamic ports
    configType?: ConfigType;
    // ordering hint, mainly for processing elements ports
    // as graph ports will use the ports y-pos for ordering
    // this is per port-type. i.e. inport and outport have independent
    // indexes
    index?: number;
}


// an inport (:
export interface Inport extends UidObject, Port {
    // from UidObject
    objectId: string;
    objectType: 'INPORT';
    // hard requirements on parameters
    requiredTypes: ParamType[];
    desiredUnits: string[];
    generatesResponse: GeneratesResponseTypes;
    // sets param on ProcessInport by default
    defaultParam?: GraphParam;
}


// an outport (:
export interface Outport extends UidObject, Port {
    // from UidObject
    objectId: string;
    objectType: 'OUTPORT';

    types: ParamType[]; // we might not know the type!
    unit?: string;
}



// a connection is defined by two ports.
export interface Connection extends UidObject {
    // from UidObject
    objectId: string;
    objectType: 'CONNECTION';

    // id of source port
    source: string;
    // id of destination port
    destination: string;
    label?: any;
    metadata?: any;
}

export interface Variable extends UidObject {
    objectId: string;
    objectType: 'NAMED_VARIABLE' | 'BROADCAST_VARIABLE';
    label: string;
    metadata?: any;
}

// defining a graph model
// all IDs are UUIDs
export interface GraphModel {
    // from UidObject
    objectId: string;
    objectType: 'GRAPH_MODEL';

    inports: { [id: string]: Inport };
    outports: { [id: string]: Outport };
    processes: { [id: string]: Process };
    connections: { [id: string]: Connection };
    variables: { [id: string]: Variable };
    metadata?: any;
    label?: string;
}


// representing a graph model in the
// tree
export interface GraphModelNode {
    name: string;
    content: GraphModel;
}
