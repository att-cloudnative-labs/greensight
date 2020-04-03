import { TreeNode } from '@app/modules/cpt/interfaces/tree-node';
import { ALL_PARAM_TYPES, GraphParam, ParamType, ProcessInterfaceDescription } from '@cpt/capacity-planning-simulation-types';


export function updateSimulationGraphModel(simulation: TreeNode, graphPid: ProcessInterfaceDescription) {
    const inportInfo: { [inportId: string]: { types: ParamType[], name: string } } = simulation.content.inports;
    if (Object.keys(simulation.content.scenarios).length !== 0) {
        for (const key of Object.keys(simulation.content.scenarios)) {
            const scenario = simulation.content.scenarios[key];

            // Add any graph inports to the scenario inports if not found
            Object.keys(graphPid.inports).forEach(inportId => {
                if (!scenario.inports[inportId]) {
                    const pidInport = graphPid.inports[inportId];
                    let requiredTypes = [];
                    if (pidInport.requiredTypes.length) {
                        requiredTypes = pidInport.requiredTypes;
                        inportInfo[inportId] = { types: pidInport.requiredTypes.concat(), name: pidInport.name };
                    } else {
                        requiredTypes = ALL_PARAM_TYPES;
                        inportInfo[inportId] = { types: [], name: pidInport.name };
                    }
                    const inportValue = pidInport.defaultParam ? pidInport.defaultParam.value : getDefaultScenarioInportValue(requiredTypes[0]);

                    scenario.inports[inportId] = {
                        type: requiredTypes[0],
                        value: inportValue
                    };
                }
            });

            // Update existing scenario inports
            Object.keys(graphPid.inports).forEach(inportId => {
                let requiredTypes = [];
                if (graphPid.inports[inportId].requiredTypes.length) {
                    requiredTypes = graphPid.inports[inportId].requiredTypes;
                    inportInfo[inportId] = { types: graphPid.inports[inportId].requiredTypes.concat(), name: graphPid.inports[inportId].name };
                } else {
                    requiredTypes = ALL_PARAM_TYPES;
                    inportInfo[inportId] = { types: [], name: graphPid.inports[inportId].name };
                }

                const scenarioInport = scenario.inports[inportId];
                const includesBreakdown = requiredTypes.findIndex(type => type === 'BREAKDOWN') !== -1;
                const includesNumber = requiredTypes.findIndex(type => type === 'NUMBER') !== -1;
                if (!includesBreakdown && !includesNumber && scenarioInport.type === 'FORECAST_VAR_REF') {
                    const inportValue = getDefaultScenarioInportValue(requiredTypes[0]);
                    scenario.inports[inportId] = {
                        type: requiredTypes[0],
                        value: inportValue
                    };
                } else if (scenarioInport && scenarioInport.type === 'FORECAST_VAR_REF' && scenarioInport.displayType === 'FORECAST_VAR_REF' && includesBreakdown && !includesNumber) {
                    const inportValue = getDefaultScenarioInportValue(requiredTypes[0]);
                    scenario.inports[inportId] = {
                        type: requiredTypes[0],
                        value: inportValue
                    };
                } else if (scenarioInport && scenarioInport.displayType === 'BREAKDOWN' && !includesBreakdown) {
                    const inportValue = getDefaultScenarioInportValue(requiredTypes[0]);
                    scenario.inports[inportId] = {
                        type: requiredTypes[0],
                        value: inportValue
                    };
                }
                if (scenarioInport && scenarioInport.type !== 'FORECAST_VAR_REF') {
                    const index = requiredTypes.findIndex(x => x === scenarioInport.type);
                    // If the scenarioInport.type is not found in the requiredTypes
                    if (index === -1) {
                        const inportValue = getDefaultScenarioInportValue(requiredTypes[0]);
                        scenario.inports[inportId] = {
                            type: requiredTypes[0],
                            value: inportValue
                        };
                    }
                }
            });

            // Remove any scenario inports if not found in graph model inports
            Object.keys(scenario.inports).forEach(scenarioInportId => {
                if (!graphPid.inports[scenarioInportId]) {
                    delete scenario.inports[scenarioInportId];
                    if (inportInfo[scenarioInportId]) {
                        delete inportInfo[scenarioInportId];
                    }
                }
            });
        }
    }
    simulation.content.modelVersion = graphPid.versionId;
    simulation.content.modelName = graphPid.name;
    if (graphPid.pathName) simulation.content.modelFullName = graphPid.pathName + "/" + graphPid.name;
    simulation.content.inports = inportInfo;
}


export function getScenarioInitialInportValue(inport): GraphParam {
    let allowedTypes: ParamType[] = ['NUMBER', 'STRING', 'BOOLEAN', 'BREAKDOWN', 'DATE'];
    if (inport.requiredTypes.length) {
        allowedTypes = inport.requiredTypes;
    }

    if (inport.defaultParam && inport.defaultParam.type && allowedTypes.findIndex(t => t === inport.defaultParam.type) > -1) {
        return {
            type: inport.defaultParam.type,
            value: inport.defaultParam.value
        } as GraphParam;
    } else {
        const initialType = allowedTypes[0];
        switch (initialType) {
            case 'NUMBER':
                return { type: 'NUMBER', value: 0 };
            case 'STRING':
                return { type: 'STRING', value: '' };
            case 'BOOLEAN':
                return { type: 'BOOLEAN', value: false };
            case 'BREAKDOWN':
                return { type: 'ASPECT', value: { type: 'BREAKDOWN', name: '', slices: {} } };
            case 'DATE': {
                return { type: 'DATE', value: new Date().toString() };
            }
        }
    }
}

export function getDefaultScenarioInportValue(firstRequiredType) {
    let inportValue: any;
    switch (firstRequiredType) {
        case 'BOOLEAN': {
            inportValue = false;
            break;
        }
        case 'NUMBER': {
            inportValue = 0;
            break;
        }
        case 'FORECAST_VAR_REF': {
            inportValue = '';
            break;
        }
    }
    return inportValue;
}
