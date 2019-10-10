import { Inport, Outport, Port, GraphParam, GraphConfig } from './graph';
import { UidObject, NodeTypes } from './object';

export type ProcessTypes = 'PROCESSING_ELEMENT' | 'GRAPH_MODEL';
export type ProcessNodeType = NodeTypes;

// all the ports of a process port template
// have to be instantiated together
export interface ProcessPortTemplate extends UidObject {
    // from UidObject
    objectId: string;
    objectType: 'PROCESS_PORT_TEMPLATE',
    description?: string;

    name: string;
    inportTemplates: { [id: string]: Inport };
    outportTemplates: { [id: string]: Outport };
}


// quick description of all things needed
// to use a process inside a graph model
export interface ProcessInterfaceDescription extends UidObject {
    // from UidObject
    objectId: string;
    objectType: 'PROCESS_INTERFACE_DESCRIPTION';
    description?: string;

    name: string;
    // static ports
    inports: { [id: string]: Inport };
    outports: { [id: string]: Outport };
    // dynamic ports
    portTemplates: { [id: string]: ProcessPortTemplate };
    visualizationHint?: string;
}

export type ProcessInterfaceDescriptionRepository = { [id: string]: ProcessInterfaceDescription }

export interface ProcessPort {
    // identify the model/pe port we're bound to
    ref: string;
    // identify the template used to create this port
    templateId?: string;
    // identify ports instatiated by a single template
    templateGroupId?: string;
    // apply configuration to dynamic ports
    config?: GraphConfig;
    // ordering hint, mainly for processing elements ports
    // as graph ports will use the ports y-pos for ordering
    // this is per port type (in/out).
    index?: number;
}

// reference an outport for a process
// from it's definition space
export interface ProcessOutport extends ProcessPort, UidObject {
    // from UidObject
    objectId: string;
    objectType: 'PROCESS_OUTPORT';
}

// reference an inport for a process from it's definition space
export interface ProcessInport extends ProcessPort, UidObject {
    // from UidObject
    objectId: string;
    objectType: 'PROCESS_INPORT';

    // apply parameters to the inport
    param?: GraphParam;
}

// each external active element inside a graph
// is represented by a process.
// all the process ports get a graph specific UUID and will
// reference the Processes Port ID internally
export interface Process extends UidObject {
    // from UidObject
    objectId: string;
    objectType: 'PROCESS';

    type: ProcessTypes;
    ref: string;
    // if not set assume latest
    version?: string;
    label?: string;
    metadata?: any;
    inports: { [id: string]: ProcessInport };
    outports: { [id: string]: ProcessOutport };
}

function getMaxPortIndex(src: { [id: string]: Port }): number {
    let maxPortIndex = 0;
    for (let id in src) {
        let p = src[id];
        if (p.index && p.index > maxPortIndex) {
            maxPortIndex = p.index;
        }
    }
    return maxPortIndex;
}

function instantiatePorts(src: { [id: string]: (Inport | Outport) }, dst: { [id: string]: (ProcessOutport | ProcessInport) }, genId: () => string, templateId?: string, templateGroupId?: string) {
    if (dst !== undefined && dst !== null) {
        let startPortIndex = getMaxPortIndex(src);
        for (let id in src) {
            let srcPort = src[id];
            let processPortId = genId();
            if (srcPort.objectType === 'INPORT') {
                dst[processPortId] = {
                    ref: id,
                    objectId: processPortId,
                    objectType: 'PROCESS_INPORT'
                };
            } else if (srcPort.objectType === 'OUTPORT') {
                dst[processPortId] = {
                    ref: id,
                    objectId: processPortId,
                    objectType: 'PROCESS_OUTPORT'
                };
            }
            if (templateId) {
                dst[processPortId].templateId = templateId;
            }
            if (templateGroupId) {
                dst[processPortId].templateGroupId = templateGroupId;
            }
            if (srcPort.index !== undefined) {
                dst[processPortId].index = startPortIndex + srcPort.index;
            }
        }
    }
}

/**
 * Populate the Process structure with the static ports of ProcessInterfaceDescription.
 *
 * For each static port a ProcessPort with an unique id is created.
 * ID's are create using the passed in genId function.
 * @param p the Process structure to populate
 * @param pid the interface description used to populate the process
 * @param genId function to generate unique IDs (think UUID)
 */
export function processPopulateStaticPorts(p: Process, pid: ProcessInterfaceDescription, genId: () => string) {
    // add references to all static inports
    instantiatePorts(pid.inports, p.inports, genId);
    // add references to all static outports
    instantiatePorts(pid.outports, p.outports, genId);
}

/**
 * Add a template to a process by creating entries for all inports/outports of that template.
 * @param p the Process to create the entries in
 * @param t the template to use
 * @param tid the template id of the template
 * @param genId function to generate unique IDs (think UUID)
 * @returns String of the template groupId.
 */
export function processAddTemplate(p: Process, t: ProcessPortTemplate, genId: () => string): string {
    let groupId = genId();
    // add references to all dynamic inports
    instantiatePorts(t.inportTemplates, p.inports, genId, t.objectId, groupId);
    // add references to all dynamic outports
    instantiatePorts(t.outportTemplates, p.outports, genId, t.objectId, groupId);
    return groupId;
}

