import { Process, GraphModel, SimulationConfiguration, SimulationResult } from '@cpt/capacity-planning-simulation-types';
import { CptSimulationHarness, getPeRepository} from '@cpt/capacity-planning-simulation';
import { fetchModel } from './http-tree-shim';
import { fetchBranchVariables } from './http-fc-shim';


let sc: SimulationConfiguration = {
    objectId: 'demosc',
    objectType: 'SIMULATION_CONFIGURATION',
    stepLast: '2020-04',
    stepStart: '2019-01',
    reportType: 'AGGREGATED',
    modelRef: "4ab22fcb-fb46-41fc-a548-03b0f43f75f1",
    monteCarloIterations: 10,
    scenarios: {
        "40f0426f-8f49-42eb-aaba-94dde16ebf20": {
            inports: {
                "1e08e6fb-4a77-4781-a081-6085a4886a22": {
                    forecastId: "5c36082d17e5d11eaaf36dfa",
                    name: "xoxo1",
                    type: "FORECAST_VAR_REF",
                    unit: "undefined",
                    variableId: "5c36170d17e5d11eaaf36dfe"
                },
                "f188e942-b87a-4b9e-8f88-23c5325a2034": {
                    forecastId: "5c36082d17e5d11eaaf36dfa",
                    name: "killas2",
                    type: "FORECAST_VAR_REF",
                    unit: "undefined",
                    variableId: "5c3614f717e5d11eaaf36dfc"
                }
            },
            name: "New Scenario",
            objectId: "40f0426f-8f49-42eb-aaba-94dde16ebf20",
            objectType: "SIMULATION_SCENARIO"
        }
    }

};



let scNested: SimulationConfiguration = {
    objectId: 'demosc',
    objectType: 'SIMULATION_CONFIGURATION',
    stepLast: '2020-04',
    stepStart: '2019-01',
    reportType: 'AGGREGATED',
    modelRef: "14e8da19-7fb4-4735-b2c0-5af14f43c2f9",
    scenarios: {
        "40f0426f-8f49-42eb-aaba-94dde16ebf20": {
            inports: {
                "414a72b0-edd8-42c5-ac17-648674cae93e": {
                    forecastId: "5c36082d17e5d11eaaf36dfa",
                    name: "xoxo1",
                    type: "FORECAST_VAR_REF",
                    unit: "undefined",
                    variableId: "5c36170d17e5d11eaaf36dfe"
                }
            },
            name: "New Scenario",
            objectId: "40f0426f-8f49-42eb-aaba-94dde16ebf20",
            objectType: "SIMULATION_SCENARIO"
        }
    }

};

let scPorts: SimulationConfiguration = {
    objectId: 'broadcast+named',
    objectType: 'SIMULATION_CONFIGURATION',
    stepLast: '2020-04',
    stepStart: '2019-01',
    reportType: 'AGGREGATED',
    modelRef: "917481b7-e3cf-43cd-a270-c206aeae318f",
    monteCarloIterations: 5,
    scenarios: {
        "default": {
            inports: {
                "1983f363-98f7-4956-8657-a8860ae47d60": {
                    type: "NUMBER",
                    unit: "undefined",
                    value: 10
                },
                "8d418059-fd69-4d45-a652-f4289f6e4a87": {
                    type: "NUMBER",
                    unit: "undefined",
                    value: 20
                },
                "feebf06b-2e61-4533-828f-50ee1499d2fe": {
                    forecastId: "5c36082d17e5d11eaaf36dfa",
                    name: "xoxo1",
                    type: "FORECAST_VAR_REF",
                    unit: "undefined",
                    variableId: "5c36170d17e5d11eaaf36dfe"
                }
            },
            name: "New Scenario",
            objectId: "default",
            objectType: "SIMULATION_SCENARIO"
        }
    }

};

let schnick: SimulationConfiguration = {
                "metadata": {},
                "modelRef": "b0026d5f-cc6b-42ef-87f1-59333c2d9dd4",
                "monteCarloIterations": 1,
                "scenarios": {
                    "da5931a7-b913-4acf-9fa8-96b4becbdb37": {
                        "inports": {
                            "f50d5cec-999f-4bae-868d-4a56402ea45b": {
                                "forecastId": "5c36082d17e5d11eaaf36dfa",
                                "name": "xoxo1",
                                "type": "FORECAST_VAR_REF",
                                "unit": "undefined",
                                "variableId": "5c36170d17e5d11eaaf36dfe"
                            }
                        },
                        "name": "New Scenario",
                        "objectId": "da5931a7-b913-4acf-9fa8-96b4becbdb37",
                        "objectType": "SIMULATION_SCENARIO"
                    }
                },
                "stepLast": "2019-10",
                "stepStart": "2019-04",
                objectId: 'broadcast+named',
                objectType: 'SIMULATION_CONFIGURATION',
                reportType: 'AGGREGATED'
            };


// let sh = new CptSimulationHarness(fetchBranchVariables, fetchModel, console.log);
// sh.runSimulationConfiguration(schnick).then(sr => console.log(JSON.stringify(sr)));

console.log(JSON.stringify(getPeRepository()));

// fetchModel('ddb1157f-0f11-491b-9e84-7f10891e2153').then(mod=>{console.log(JSON.stringify(mod))});