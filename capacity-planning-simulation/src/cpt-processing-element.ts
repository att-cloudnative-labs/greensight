import { CptEnvironmentIf, CptSimulationProcessIf, CptOutput, CptInformationPackage, genSimId, CptSimulationNodeIf } from './cpt-object';
import { GraphModel, Process, NodeTypes, Inport, Outport, ProcessPortTemplate, ProcessInterfaceDescriptionRepository, ProcessInterfaceDescription, GraphParam, ProcessPort, ProcessInport, ProcessOutport } from '@cpt/capacity-planning-simulation-types';
import { CptInport, CptOutport, CptPort } from './cpt-port';
import { aggregateResponseParallel } from './cpt-response-ops';


export class CptProcessingElement implements CptSimulationProcessIf {

    env: CptEnvironmentIf;
    nodeType: NodeTypes = 'PROCESSING_ELEMENT';
    ref: string;
    version?: string;
    simulationNodeId: string;
    processNodeId: string;
    getSimulationNodePath(): string[] {
        return this.parentNodePath.concat(this.simulationNodeId);
    }
    label?: string;


    private parentNodePath: string[] = [];

    protected inports: { [internalId: string]: CptInport } = {};
    protected outports: { [internalId: string]: CptOutport } = {};
    protected dynamicPorts: { [templateGroupId: string]: (CptInport | CptOutport)[] } = {};
    protected inportsExternalId: { [procNodeId: string]: CptInport } = {};
    protected outportsExternalId: { [procNodeId: string]: CptOutport } = {};


    constructor(public proc: Process, public ifDescription: ProcessInterfaceDescription, public parent: CptSimulationProcessIf) {
        if (parent) {
            this.parentNodePath = parent.getSimulationNodePath();
        }
        this.processNodeId = proc.objectId;
        this.simulationNodeId = genSimId(this.parentNodePath, this.processNodeId);
        this.ref = proc.ref;
    }

    protected createStaticInports(): boolean {
        this.env.logProgress("creating static inports " + this.label);
        for (let procPortId in this.proc.inports) {
            this.env.logProgress(JSON.stringify(this.proc.inports));
            let procPort = this.proc.inports[procPortId];
            this.env.logProgress(JSON.stringify(procPort));
            // todo: make sure this field is always available
            procPort.objectId = procPortId;
            procPort.objectType = 'PROCESS_INPORT';
            // // skip dynamic ports
            if (procPort["templateGroupId"] || procPort["templateId"]) {
                continue;
            }
            let inportDef = this.ifDescription.inports[procPort.ref];
            if (!inportDef) {
                return false;
            }

            let inport = new CptInport(inportDef, procPort, this);
            this.inports[procPort.ref] = inport;
            this.inportsExternalId[procPortId] = inport;
        }
        return true;
    }

    protected createStaticOutports(): boolean {
        this.env.logProgress("creating static outports " + this.label);
        for (let procPortId in this.proc.outports) {
            let procPort = this.proc.outports[procPortId];
            // todo: make sure this field is always available
            procPort.objectId = procPortId;
            procPort.objectType = 'PROCESS_OUTPORT';
            // skip dynamic ports
            if (procPort["templateGroupId"] || procPort["templateId"]) {
                continue;
            }

            let outportDef = this.ifDescription.outports[procPort.ref];
            if (!outportDef) {
                return false;
            }

            let outport = new CptOutport(outportDef, procPort, this);
            this.outports[procPort.ref] = outport;
            this.outportsExternalId[procPortId] = outport;
        }
        return true;
    }

    private getProcessPortsWithTemplateGroups(): { [templateGroupId: string]: (ProcessInport | ProcessOutport)[] } {
        let templateGroups: { [templateGroupId: string]: (ProcessInport | ProcessOutport)[] } = {};
        for (let procPortId in this.proc.inports) {
            let procPort = this.proc.inports[procPortId];
            if (procPort.templateGroupId) {
                if (!templateGroups[procPort.templateGroupId]) {
                    templateGroups[procPort.templateGroupId] = [];
                }

                templateGroups[procPort.templateGroupId].push(procPort);
            }
        }
        for (let procPortId in this.proc.outports) {
            let procPort = this.proc.outports[procPortId];
            if (procPort.templateGroupId) {
                if (!templateGroups[procPort.templateGroupId]) {
                    templateGroups[procPort.templateGroupId] = [];
                }
                templateGroups[procPort.templateGroupId].push(procPort);
            }
        }

        return templateGroups;
    }


    // dynamic ports have a templateId, templateGroupId and a ref.
    // templateId reference to a template set in the process interface description
    // the template group id is a UUID that's identifying each instance of template port groups
    // this is needed if a single template contains multiple ports.
    // the ref is used to identify which port of a template is actually
    // meant
    protected createDyamicPorts(): boolean {
        this.env.logProgress("creating dynamic ports " + this.label);
        let templateGroups = this.getProcessPortsWithTemplateGroups();
        for (let templateGroupId in templateGroups) {
            let templatePorts = templateGroups[templateGroupId];
            if (!templatePorts || templatePorts.length < 1) {
                return false;
            }

            // we can take the templateId from the first port,
            // they should be identical for all ports of this group
            let templateId = templatePorts[0].templateId;
            let template = this.ifDescription.portTemplates[templateId];
            if (!template) {
                return false;
            }
            for (let procPort of templatePorts) {
                if (procPort.objectType == 'PROCESS_INPORT') {
                    let inportDef = template.inportTemplates[procPort.ref];
                    let inport = new CptInport(inportDef, procPort, this);
                    this.inportsExternalId[procPort.objectId] = inport;
                    if (!this.dynamicPorts[templateGroupId]) {
                        this.dynamicPorts[templateGroupId] = [];
                    }
                    this.dynamicPorts[templateGroupId].push(inport);

                } else if (procPort.objectType == 'PROCESS_OUTPORT') {
                    let outportDef = template.outportTemplates[procPort.ref];
                    let outport = new CptOutport(outportDef, procPort, this);
                    this.outportsExternalId[procPort.objectId] = outport;
                    if (!this.dynamicPorts[templateGroupId]) {
                        this.dynamicPorts[templateGroupId] = [];
                    }
                    this.dynamicPorts[templateGroupId].push(outport);
                }
            }
        }
        return true;
    }

    protected getTemplatePortInstances(templatePortId: string): (CptInport | CptOutport)[] {
        let templatePorts: (CptInport | CptOutport)[] = [];
        for (let templateGroupId in this.dynamicPorts) {
            let groupPorts = this.dynamicPorts[templateGroupId];
            for (let port of groupPorts) {
                if (port.ref === templatePortId) {
                    templatePorts.push(port);
                }
            }
        }
        return templatePorts;
    }

    protected initInports(): boolean {
        this.env.logProgress("initializing inports " + this.label);
        for (let inportId in this.inports) {
            let inport = this.inports[inportId];
            if (!inport.init(this.env)) {
                return false;
            }
        }
        return true;
    }

    protected initOutports(): boolean {
        this.env.logProgress("initializing outports " + this.label);
        for (let outportId in this.outports) {
            let outport = this.outports[outportId];
            if (!outport.init(this.env)) {
                return false;
            }
        }
        return true;
    }

    protected initDynamicPorts(): boolean {
        this.env.logProgress("initializing dynamic ports " + this.label);
        for (let templateGroupId in this.dynamicPorts) {
            for (let port of this.dynamicPorts[templateGroupId]) {
                this.env.logProgress("initializing " + port.label);
                if (!port.init(this.env)) {
                    return false;
                }
            }
        }
        return true;
    }

    // aggregate responses from given outports and forward to all given inports
    protected aggregateResponses(outports: CptOutport[], inports: CptInport[]) {
        let responses: GraphParam[] = [];
        for (let outport of outports) {
            outport.processResponse();
            responses.push(outport.yieldResponse());
        }
        let aggregatedResponse = aggregateResponseParallel(responses);
        if (aggregatedResponse) {
            for (let inport of inports) {
                inport.acceptResponse(aggregatedResponse);
                inport.processResponse();
            }
        }
    }

    // aggregate the responses from all outports and send to all inports that have
    // generatesResponse set to PASSTHROUGH or ALWAYS
    protected autoAggregateResponses() {
        let responseInports: CptInport[] = [];
        let outports: CptOutport[] = [];
        for (let outportId in this.outports) {
            outports.push(this.outports[outportId]);
        }

        for (let inportId in this.inports) {
            let inport = this.inports[inportId];
            if (inport.inport.generatesResponse !== 'NEVER') {
                responseInports.push(inport);
            }
        }
        this.aggregateResponses(outports, responseInports);
    }


    private getAllSimulationSubNodes(): CptSimulationNodeIf[] {
        let subNodes: CptSimulationNodeIf[] = [];
        for (let inportId in this.inports) {
            subNodes.push(this.inports[inportId]);
        }
        for (let outportId in this.outports) {
            subNodes.push(this.outports[outportId]);
        }
        return subNodes;
    }


    // initialize once
    public init(env: CptEnvironmentIf): boolean {
        this.env = env;
        // todo: atm static has to be run before dynamic port creation
        // because the static methods also patch up the data structures
        if (!this.createStaticInports()) {
            this.env.logProgress("failed to create static inports for " + this.label);
        } else if (!this.createStaticOutports()) {
            this.env.logProgress("failed to create static outport for " + this.label);
        } else if (!this.createDyamicPorts()) {
            this.env.logProgress("failed to create dynamic ports for " + this.label);
        } else if (!this.initInports()) {
            this.env.logProgress("failed to init static inports for " + this.label);
        } else if (!this.initOutports()) {
            this.env.logProgress("failed to init static outports for " + this.label);
        } else if (!this.initDynamicPorts()) {
            this.env.logProgress("failed to init dynamic ports for " + this.label);
        } else {
            this.env.registerSimulationNode(this, this.parent, this.getAllSimulationSubNodes());
            return true;
        }
        return false;
    }
    // reset internal data structures.
    // should be able to re-run from here
    public reset() {
        for (let inportId in this.inports) {
            let inport = this.inports[inportId];
            inport.reset();
        }
        for (let outportId in this.outports) {
            let outport = this.outports[outportId];
            outport.reset();
        }
        for (let templateGroup in this.dynamicPorts) {
            let portGroup = this.dynamicPorts[templateGroup];
            for (let port of portGroup) {
                port.reset();
            }
        }
    }
    // accept load on the inports
    public acceptLoad(load: GraphParam, portId?: string) {
        if (portId) {
            let port = this.inportsExternalId[portId] || this.inports[portId];
            if (port) {
                port.acceptLoad(load);
            }
        }
    }
    // process the load internally
    public process() {

    }
    // yield load on the outports
    public yieldLoad(outportId: string): GraphParam {
        let outport = this.outports[outportId] || this.outportsExternalId[outportId];
        if (outport) {
            return outport.yieldLoad();
        }
        return null;
    }
    // accept response IP on the outport
    public acceptResponse(response: GraphParam, portId?: string) {
        if (portId) {
            let port = this.outportsExternalId[portId] || this.outports[portId];
            if (port) {
                port.acceptResponse(response);
            }
        }

    }
    // process the response internally
    public processResponse() {
        this.autoAggregateResponses();

    }
    // yield responses on the inport
    public yieldResponse(inportId?: string): GraphParam {
        if (inportId) {
            let port = this.inportsExternalId[inportId] || this.inports[inportId];
            if (port) {
                return (port.yieldResponse());
            }
        }
    }

    // re-calculate output based on global state.
    public postProcess() {
        for (let inportId in this.inports) {
            let inport = this.inports[inportId];
            inport.postProcess();
        }
        for (let outportId in this.outports) {
            let outport = this.outports[outportId];
            outport.postProcess();
        }
        for (let templateGroup in this.dynamicPorts) {
            let portGroup = this.dynamicPorts[templateGroup];
            for (let port of portGroup) {
                port.postProcess();
            }
        }

    }
    // finalize all internal calculatio and emit results
    public finalize() {

    }

}