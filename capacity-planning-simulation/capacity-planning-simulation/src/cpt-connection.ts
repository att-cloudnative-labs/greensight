import { CptEnvironmentIf, CptSimulationProcessIf, CptSimulationNodeIf, CptOutput, CptInformationPackage, genSimId } from './cpt-object';
import { GraphModel, Process, NodeTypes, Connection } from '@cpt/capacity-planning-simulation-types';


export class CptConnection implements CptSimulationNodeIf {

    env: CptEnvironmentIf;
    nodeType: NodeTypes = 'CONNECTION';
    ref: string;
    simulationNodeId: string;
    processNodeId: string;
    getSimulationNodePath(): string[] {
        return this.parentNodePath.concat(this.simulationNodeId);
    }
    label?: string;

    private parentNodePath: string[] = [];


    constructor(public conn: Connection, public parent: CptSimulationProcessIf) {
        if (parent) {
            this.parentNodePath = parent.getSimulationNodePath();
        }
        this.processNodeId = conn.objectId;
        this.simulationNodeId = genSimId(this.parentNodePath, this.processNodeId);
        // not sure if this helps anybody
        this.ref = conn.objectId;
    }

    // initialize once
    public init(env: CptEnvironmentIf): boolean {
        this.env = env;
        this.env.registerSimulationNode(this, this.parent);
        return true;
    }
}