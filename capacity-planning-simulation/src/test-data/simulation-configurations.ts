import { SimulationConfiguration } from '@cpt/capacity-planning-simulation-types';

export function getSimulationConfiguration(nameOrId: string): SimulationConfiguration {
    let scNameId = testSimulationConfigurationlNames[nameOrId];
    if (scNameId) {
        return testSimulationConfigurations[scNameId];
    } else {
        return testSimulationConfigurations[nameOrId];
    }
}

export const testSimulationConfigurationlNames: { [configName: string]: string } = {
    "INOUT": "a4e1eca3-96fa-4117-8a41-d0f9bb77e1f8"
}

export const testSimulationConfigurations: { [configurationId: string]: SimulationConfiguration } = {
    "a4e1eca3-96fa-4117-8a41-d0f9bb77e1f8": {
        "metadata": {},
        "modelRef": "8e9eb803-238c-40f4-ab89-01e8d3f63179",
        "monteCarloIterations": null,
        "objectId": "a4e1eca3-96fa-4117-8a41-d0f9bb77e1f8",
        "objectType": "SIMULATION_CONFIGURATION",
        "reportType": "AGGREGATED",
        "scenarios": {
            "13e379da-e158-42b8-93b8-773b4caec127": {
                "inports": {
                    "9c914597-fba7-41a8-af70-d6ac751bb476": {
                        "type": "NUMBER",
                        "unit": "undefined",
                        "value": 10
                    }
                },
                "name": "New Scenario",
                "objectId": "13e379da-e158-42b8-93b8-773b4caec127",
                "objectType": "SIMULATION_SCENARIO",
            }
        },
        "stepLast": "2019-10",
        "stepStart": "2019-04"
    }
};