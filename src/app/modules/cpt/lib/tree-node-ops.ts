import { v4 as uuid } from 'uuid';


export function generateUnique(usedNames: string[], name: string): string {
    let maxRetries = 100;
    while (usedNames.find(n => n === name)) {
        if (maxRetries === 0) {
            console.error('Exceeded tree node name incrementation, cancelling tree node creation operation');
            return;
        }
        const regexp = /\s\d+$/;
        const increment = name.match(regexp);
        if (increment) {
            const newIncrement = parseInt(increment[0], 0) + 1;
            name = name.replace(regexp, ` ${newIncrement}`);
        } else {
            name = name.replace(/$/, ' 1');
        }
        maxRetries--;
    }
    return name;
}


export function generateUniqueName(existingItems, baseName: string): string {
    let usedNames = Object.keys(existingItems).map(key => existingItems[key].name);
    return generateUnique(usedNames, baseName);

}

export function generateUniqueLabel(existingItems, baseLabel: string): string {
    let usedNames = Object.keys(existingItems).map(key => existingItems[key].label);
    return generateUnique(usedNames, baseLabel);
}



/**
 * Cloning content properties
 * @param props
 * @param conns
 */
export function cloneProperty(props, conns?) {
    const cloneValues: any = {};
    Object.values(props).forEach(prop => {
        const propId = uuid();
        const propObj: any = Object.assign({}, prop);
        const cloneProp: any = Object.assign({}, prop);
        cloneProp.objectId = propId;
        if (cloneProp.scenarioId) {
            cloneProp.scenarioId = propId;
        }
        cloneValues[propId] = cloneProp;

        // edit connection source and destination
        if (conns) {
            editConnectionProperties(conns, propObj.objectId, propId);
        }
    });
    return cloneValues;
}

/**
 * replace source and destination of connections with new ones
 * @param newConns
 * @param oldId
 * @param newId
 */
export function editConnectionProperties(newConns: any, oldId: string, newId: string) {
    Object.values(newConns).forEach(conn => {
        const connection: any = Object.assign({}, conn);
        if (connection.source === oldId) {
            newConns[connection.objectId].source = newId;
        }
        if (connection.destination === oldId) {
            newConns[connection.objectId].destination = newId;
        }
    });
}

/**
 * set new references for Variables and connections
 * @param ref
 * @param newRefs
 * @param newRefId
 * @param newVarId
 * @param connections
 * @param position
 */
export function setNewRefForVarAndConnection(ref: any, newRefs: any, newRefId: string, newVarId: string, connections: any, position: any) {
    newRefs.push({
        portId: ref.portId ? newVarId : undefined,
        id: newRefId,
        metadata: {
            x: position.x + ref.metadata.x,
            y: position.y + ref.metadata.y
        },
        portType: ref.portType
    });
    Object.keys(connections).forEach(key => {
        const connection: any = Object.assign({}, connections[key]);
        if (connection.metadata && connection.metadata.referenceDestination && connection.metadata.referenceDestination === ref.id) {
            connections[connection.objectId].metadata = {
                referenceDestination: newRefId
            };
        }
        if (connection.metadata && connection.metadata.referenceSource && connection.metadata.referenceSource === ref.id) {
            connections[connection.objectId].metadata = {
                referenceSource: newRefId
            };
        }
    });
}

/**
 * push pasted elements to newSelections array for selecting after pasting
 * @param newSelections
 * @param nodeType
 * @param newId
 * @param nodeId
 */
export function pushNewSelections(newSelections: any, nodeType: string, newId: string, nodeId: string) {
    newSelections.push({
        nodeType: nodeType,
        nodeId: newId,
        graphModelId: nodeId,
        modifierKeys: ['Shift']
    });
}

/**
 * create new inport/outport and set their properties: objectId, name, metadata
 * @param newId
 * @param desInOutports
 * @param sourceInOutports
 * @param seletedId
 * @param position
 * @param connectionPorts
 */
export function pasteNewInportOutport(newId: string, desInOutports: any, sourceInOutports: any, seletedId: string, position: any, connectionPorts: any) {
    const destinationInOutport = Object.assign({}, sourceInOutports[seletedId]);
    destinationInOutport.objectId = newId;
    destinationInOutport.metadata = {
        x: position.x + sourceInOutports[seletedId].metadata.x,
        y: position.y + sourceInOutports[seletedId].metadata.y
    };
    destinationInOutport.name = generateUniqueName(desInOutports, sourceInOutports[seletedId].name);
    desInOutports[newId] = destinationInOutport;
    connectionPorts.push(newId);
}



