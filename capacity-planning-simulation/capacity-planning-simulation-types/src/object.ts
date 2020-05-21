
export type NodeTypes = 'PROCESSING_ELEMENT' | 'GRAPH_MODEL' | 'INPORT' | 'OUTPORT' | 'CONNECTION' | 'PROCESS_INPORT' | 'PROCESS_OUTPORT' | 'NAMED_VARIABLE' | 'BROADCAST_VARIABLE' | 'BREAKDOWN' | 'SLICE';
export type UidObjectTypes = NodeTypes | 'PROCESS' | 'PROCESS_PORT_TEMPLATE' | 'PROCESS_INTERFACE_DESCRIPTION' | 'SIMULATION_NODE' | 'SIMULATION_SCENARIO' | 'SIMULATION_RESULT' | 'SIMULATION_CONFIGURATION' | 'FC_SHEET_REF';
export type TrackingModes = 'LATEST_RELEASE' | 'CURRENT_VERSION' | 'FIXED';

export interface ResponseValueEntry {
    value: number,
    freq: number
}
export type ResponseValue = ResponseValueEntry[];

export interface UidObject {
    objectId: string;
    objectType: UidObjectTypes;

}

export interface ReleaseTrackingUidObject extends UidObject {
    releaseNr?: number;
    tracking?: TrackingModes;
    ref: string;
}

export type UidObjectMap = { [id: string]: UidObject };
