import { GraphModel } from '@cpt/capacity-planning-simulation-types';

export const testGraphModelNames: { [modelName: string]: string } = {
    "INOUT": "8e9eb803-238c-40f4-ab89-01e8d3f63179"
}

export const testGraphModels: { [modelId: string]: GraphModel } = {
    "8e9eb803-238c-40f4-ab89-01e8d3f63179": {
        "connections": {
            "92a73e8b-9986-4c4b-a760-e0ffaf768114": {
                "destination": "256c466e-c4dc-4129-b54b-a212a41efa0e",
                "objectId": "92a73e8b-9986-4c4b-a760-e0ffaf768114",
                "objectType": "CONNECTION",
                "source": "9c914597-fba7-41a8-af70-d6ac751bb476"
            }
        },
        "inports": {
            "9c914597-fba7-41a8-af70-d6ac751bb476": {
                "desiredUnits": [],
                "generatesResponse": "PASSTHROUGH",
                "metadata": {
                    "x": 280.20001220703125,
                    "y": 223.1999969482422
                },
                "name": "Inport",
                "objectId": "9c914597-fba7-41a8-af70-d6ac751bb476",
                "objectType": "INPORT",
                "requiredTypes": []
            }
        },
        "metadata": {},
        "objectId": "8e9eb803-238c-40f4-ab89-01e8d3f63179",
        "objectType": "GRAPH_MODEL",
        "outports": {
            "256c466e-c4dc-4129-b54b-a212a41efa0e": {
                "generatesResponse": "PASSTHROUGH",
                "metadata": {
                    "x": 641.2000122070312,
                    "y": 222.1999969482422
                },
                "name": "Outport",
                "objectId": "256c466e-c4dc-4129-b54b-a212a41efa0e",
                "objectType": "OUTPORT",
                "types": []
            }
        },
        "processes": {},
        "variables": {}
    } as GraphModel
};