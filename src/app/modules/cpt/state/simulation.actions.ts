import { ProcessInterfaceDescription } from '@cpt/capacity-planning-simulation-types/lib';
import { TreeNodeReferenceTracking } from '@cpt/interfaces/tree-node-tracking';
import { HttpErrorResponse } from '@angular/common/http';

export class MonteCarloUpdated {
    static readonly type = '[Simulation] Monte Carlo Updated';
    constructor(public readonly payload: {
        id: string,
        newMonteCarloValue: number
    }) { }
}

export class GraphModelSelected {
    static readonly type = '[Simulation] Graph Model Selected';
    constructor(public readonly payload: {
        id: string,
        graphModelId: any
    }) { }
}

export class InportScenarioUpdated {
    static readonly type = '[Simulation] Inport Scenario Updated';
    constructor(public readonly payload: {
        simulationId: string,
        scenarioId: string,
        inportId: string,
        newScenarioInport: any
    }) { }
}

export class InportScenarioVariableUpdated {
    static readonly type = '[Simulation] Inport Scenario Variable Updated';
    constructor(public readonly payload: {
        simulationId: string,
        scenarioId: string,
        inportId: string,
        newScenarioInport: any
    }) { }
}

export class GraphModelInterfaceUpdated {
    static readonly type = '[Simulation] Graph Model Interface Updated';
    constructor(public readonly payload: {
        simulationId: string,
        pid: ProcessInterfaceDescription,
        releaseNr?: number
    }) { }
}


export class StartDateUpdated {
    static readonly type = '[Simulation] Satrt Date Updated';
    constructor(public readonly payload: {
        simulationId: string,
        stepStart: string
    }) { }
}

export class EndDateUpdated {
    static readonly type = '[Simulation] End Date Updated';
    constructor(public readonly payload: {
        simulationId: string,
        stepLast: string
    }) { }
}

export class SimulationResultCreated {
    static readonly type = '[Simulation] Simulation Result Created';
    constructor(public readonly payload: any) { }
}

export class SimulationResultCreationFailed {
    static readonly type = '[Simulation] Simulation Result Creation Failed';
    constructor(public readonly payload: { simulationId: string, error: HttpErrorResponse }) { }
}

export class AddScenarioButtonClicked {
    static readonly type = '[Simulation] Add Simulation Scenario Button clicked';
    constructor(public readonly payload: {
        simulationId: string,
        newScenario: any
    }) { }
}

export class RemoveScenarioButtonClicked {
    static readonly type = '[Simulation] Remove Simulation Scenario Button Clicked';
    constructor(public readonly payload: {
        simulationId: string,
        scenarioId: string
    }) { }
}

export class RenameScenarioClicked {
    static readonly type = '[Simulation] Rename Scenario Clicked';
    constructor(public readonly payload: {
        simulationId: string,
        scenarioId: string,
        updatedName: string,
    }) { }
}

export class AddedForecastSheetClicked {
    static readonly type = '[Simulation] Added Forecast Sheet Clicked';
    constructor(public readonly payload: {
        simulationId: string,
        forecastSheetId: string,
        releaseNr: number,
        label: string
    }) { }
}

export class ForecastSheetTrackingUpdateClicked {
    static readonly type = '[Simulation] Forecast Sheet Tracking Update Clicked';
    constructor(public readonly payload: {
        simulationId: string,
        forecastSheetReferenceId: string,
        tracking: TreeNodeReferenceTracking
    }) { }
}

export class RemoveForecastSheetClicked {
    static readonly type = '[Simulation] Removed Forecast Sheet Clicked';
    constructor(public readonly payload: {
        simulationId: string,
        forecastSheetReferenceId: string
    }) { }
}
export class GraphModelTrackingUpdateClicked {
    static readonly type = '[Simulation] Graph Model Tracking Update Clicked';
    constructor(public readonly payload: {
        simulationId: string,
        tracking: TreeNodeReferenceTracking,
        pid?: ProcessInterfaceDescription
    }) { }
}

