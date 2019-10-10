
export type NodeTypes = 'PROCESSING_ELEMENT' | 'GRAPH_MODEL' | 'INPORT' | 'OUTPORT' | 'CONNECTION' | 'PROCESS_INPORT' | 'PROCESS_OUTPORT' | 'NAMED_VARIABLE' | 'BROADCAST_VARIABLE' | 'BREAKDOWN' | 'SLICE';
export type UidObjectTypes = NodeTypes | 'PROCESS' | 'PROCESS_PORT_TEMPLATE' | 'PROCESS_INTERFACE_DESCRIPTION' | 'SIMULATION_NODE' | 'SIMULATION_SCENARIO' | 'SIMULATION_RESULT' | 'SIMULATION_CONFIGURATION';

export interface ResponseSplitEntry {
    value: number,
    freq: number
}
export type ResponseSplit = ResponseSplitEntry[];

export interface UidObject {
    objectId: string;
    objectType: UidObjectTypes;

}

export type UidObjectMap = { [id: string]: UidObject };