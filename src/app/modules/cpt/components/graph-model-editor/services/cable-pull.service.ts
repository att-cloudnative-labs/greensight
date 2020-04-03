import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';

import { LayoutEngineService } from '@app/modules/cpt/components/graph-model-editor/services/layout-engine.service';
import { GraphModel, Port } from '@app/modules/cpt/models/graph-model.model';
import { GmPinComponent } from '@app/modules/cpt/components/graph-model-editor/gm-pin/gm-pin.component';
import { Modal } from 'ngx-modialog-7/plugins/bootstrap';

export interface Anchor {
    nativeElement: HTMLElement;
    portType: string;
    id: string;
}

/*
* REFACTOR: Rename this -- it's responsible for facilitating cable pulls, but also for cataloging pins to draw connections
*/
@Injectable()
export class CablePullService {
    isActive: Boolean = false;
    isDropping: Boolean = false;
    source;
    destination;
    pullComplete = new ReplaySubject();
    pullDrop = new ReplaySubject();
    pins: GmPinComponent[] = [];
    anchors: Anchor[] = [];
    graphModel: GraphModel;
    port: Port;

    constructor(private layoutEngineService: LayoutEngineService, private modal: Modal) { }

    registerPin(pin: GmPinComponent) {
        this.pins.push(pin);
    }

    unregisterPin(pin: GmPinComponent) {
        this.pins = this.pins.filter(x => x !== pin);
    }

    registerAnchor(anchor: Anchor) {
        this.anchors.push(anchor);
    }

    unregisterAnchor(anchor: Anchor) {
        this.anchors = this.anchors.filter(x => x.id !== anchor.id);
    }

    setGraphModel(graphModel: GraphModel) {
        this.graphModel = graphModel;
    }

    dropComplete() {
        this.isDropping = false;
        this.isActive = false;
        this.source = null;
        this.destination = null;
        this.port = null;
    }

    get dropDestination() {
        const pt = (this.port.isSource) ? this.destination : this.source;
        return this.layoutEngineService.translatePoint(pt);
    }

    startPull(port: Port, mouseDownEvent: MouseEvent) {
        this.isActive = true;
        this.source = port.id;
        this.destination = port.id;
        this.port = port;

        // sets the end of the line to current position of the mouse
        $(document).on(`mousemove.${port.id}`, (mouseDownEvent) => {
            const pt = {
                x: mouseDownEvent.clientX,
                y: mouseDownEvent.clientY
            };

            if (port.isSource) {
                this.destination = pt;
            } else {
                this.source = pt;
            }
        });

        $(document).on(`mouseup.${port.id}`, (mouseUpEvent: any) => {
            mouseUpEvent.preventDefault();
            $(document).off(`mousemove.${port.id}`);
            $(document).off(`mouseup.${port.id}`);

            const pin = this.pins.find(pin => pin.matchesDropTarget(mouseUpEvent.target));

            if (pin) {
                const dropPort = pin.port;
                const source = port.isSource ? port.id : dropPort.id;
                const destination = port.isSource ? dropPort.id : port.id;
                const edge = {
                    source,
                    destination
                };

                const validationResult = this.graphModel.validateConnection(edge);
                if (validationResult instanceof Error) {
                    if (validationResult.message === 'circular') {
                        this.modal
                            .alert()
                            .title('Warning')
                            .body('Circular connection detected, connection has been prevented')
                            .open();
                    } else {
                        throw validationResult;
                    }
                } else {
                    if (validationResult) {
                        this.pullComplete.next(edge);
                    }
                }
                this.dropComplete();
            } else {
                if (this.port.portType === 'destination' && this.availableVariables.length === 0) {
                    this.isActive = false;
                    this.source = null;
                    this.destination = null;
                } else {
                    this.isDropping = true;
                    this.pullDrop.next(mouseUpEvent);
                }
            }
        });
    }

    get availableVariables() {
        let variables = this.graphModel.variables;
        const connections = this.graphModel.connections;
        const originPortId = this.port.id;
        const originPortType = this.port.portType;

        const connectionsToOriginPort = connections.filter(x => x.source === originPortId || x.destination === originPortId);

        connectionsToOriginPort.forEach(connection => {
            variables = variables.filter(xVar => xVar.objectId !== connection.source && xVar.objectId !== connection.destination);
        });

        if (originPortType === 'source') {
            return variables.filter(x => x.objectType === 'BROADCAST_VARIABLE');
        } else {
            return variables;
        }
    }
}
