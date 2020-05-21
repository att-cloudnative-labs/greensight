

export type SimulationStage = 'SETUP' | 'SIMULATION' | 'AGGREGATION' | 'UPLOAD';
export type SimulationMessageCodeSetup = 'TOKEN_EXPIRED' | 'MODEL_BE_DOWN' | 'GRAPH_MODEL_MISSING' | 'FORECAST_SHEET_MISSING' | 'MODEL_INITIALIZATION_FAILED' | 'GRAPH_MODEL_TRASHED' | 'FORECAST_SHEET_TRASHED';
export type SimulationMessageCodeSim = 'INPORT_PARAM_MISSING' | 'COMPUTATIONAL_ERROR';
export type SimulationMessageCodeAggregation = 'INCOMPLETE_DATA';
export type SimulationMessageCodeUpload = 'MODEL_BE_DOWN';
export type SimulationMessageCode = 'EXCEPTION' | SimulationMessageCodeSetup | SimulationMessageCodeSim | SimulationMessageCodeAggregation | SimulationMessageCodeUpload;

export interface SimulationRuntimeMessage {
    stage: SimulationStage;
    code: SimulationMessageCode;
    nodeId?: string;
    stack?: { nodeId: string, name: string }[];
    date?: string;
    scenarioId?: string;
    desc?: string;
}
