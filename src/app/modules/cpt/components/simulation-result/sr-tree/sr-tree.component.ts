import { Component, Input, HostListener, ElementRef, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { SimulationNode } from '@cpt/capacity-planning-simulation-types';
import { Store } from '@ngxs/store';
import * as simulationResultActions from '@cpt/state/simulation-result-screen.actions';
import { Observable } from 'rxjs';
import { SRSDatatableProperties } from '@cpt/models/srs-datatable-properties';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { SRSState } from '@cpt/state/simulation-result-screen.state';
import { map, filter } from 'rxjs/operators';
import { SimulationResult } from '@cpt/capacity-planning-simulation-types/lib';




interface FlatNode {
    result: SimulationNode;
    level: number;
    dataType: string;
    expandable: boolean;
    expanded: boolean;
    visible: boolean;
    warning: boolean;
    childWarning: boolean;
}

@Component({
    selector: 'app-sr-tree',
    templateUrl: './sr-tree.component.html',
    styleUrls: ['./sr-tree.component.css']
})
export class SrTreeComponent implements OnChanges, OnDestroy, OnInit {
    @Input() result: SimulationResult;
    @Input() selectedScenarioId;
    @Input() simResultId;
    @Input() dataType = 'data';

    isFocused = false;
    flatNodes: FlatNode[] = [];
    selection: FlatNode[] = [];
    nodesToRemove = [];
    simulationResultProperties$: Observable<SRSDatatableProperties>;
    expansion: { [nodeId: string]: boolean } = {};


    PRIORITIES = {
        'PROCESS_INPORT': 0,
        'PROCESS_OUTPORT': 1,
        'GRAPH_MODEL': 2,
        'PROCESSING_ELEMENT': 3,
    };

    constructor(private host: ElementRef, private store: Store) {

    }

    ngOnInit() {
        this.simulationResultProperties$ = this.store.select(SRSState.resultById).pipe(
            map(byId => byId(this.simResultId)),
            filter(properties => properties !== null && properties !== undefined)
        );
        this.simulationResultProperties$.pipe(untilDestroyed(this)).subscribe(simulationResultProperties => {
            this.expansion = { ...simulationResultProperties.expansionStateVariables };
            for (let i = this.flatNodes.length - 1; i >= 0; i--) {
                const node = this.flatNodes[i];
                // root level is expanded by default.
                // everything else is collapsed
                let expandedStore = node.level === 0;
                // overrides by user
                if (this.expansion.hasOwnProperty(node.result.objectId)) {
                    expandedStore = this.expansion[node.result.objectId];
                }
                node.expanded = expandedStore;

            }
            this.smartNodeVisibilityFullUpdate();
        });
    }

    ngOnDestroy() { }


    ngOnChanges() {
        const resultArray: SimulationNode[] = Object.values(this.result.nodes);
        for (let index = 0; index < resultArray.length; index++) {
            const scenarioIds = Object.keys(resultArray[index].aggregatedReport);
            const scenarioIdIndex = scenarioIds.findIndex(id => id === this.selectedScenarioId);
            if (scenarioIdIndex === -1 && resultArray[index].processNodeId !== 'root' && (resultArray[index].type === 'BREAKDOWN' || resultArray[index].type === 'SLICE')) {
                this.nodesToRemove.push(resultArray[index]);
            }
        }


        this.nodesToRemove.forEach(node => {
            resultArray.splice(resultArray.findIndex(x => x === node), 1);
        });
        this.nodesToRemove = [];
        const root = resultArray.find(node => node.processNodeId === 'root');
        this.flatNodes = this.flatten(resultArray, root, 0);
        this.smartNodeVisibilityFullUpdate();
    }

    private flatten(nodes: SimulationNode[], current: SimulationNode, level: number): FlatNode[] {
        let out: FlatNode[] = [];
        const updatedNodes: SimulationNode[] = Object.values(nodes).filter((node: any) => this.flatNodes.indexOf(node) < 0);
        const children = updatedNodes.filter((x: any) => {
            return (
                x.parentInstanceId === current.objectId
                && x.ref !== '41c22bcb-f966-406a-8814-a7b8e187b508'
                && x.ref !== 'e3cc50a9-795c-4a47-8643-6d0aee39b49c'
                && (x.aggregatedReport || x.subNodeInstanceIds)
            );
        }).sort((a: any, b: any) => {
            return this.PRIORITIES[a.type] - this.PRIORITIES[b.type];
        });
        // ignoring Connection result nodes for now
        if (current.type !== 'CONNECTION') {
            let isExpanded = level === 0;
            if (this.expansion[current.objectId] !== undefined) {
                isExpanded = this.expansion[current.objectId];
            }
            const currentFlatNode: FlatNode = {
                result: current,
                level,
                dataType: this.dataType,
                expandable: !!children.length,
                expanded: isExpanded,
                visible: level < 2,
                warning: current.warnings && current.warnings.length > 0,
                childWarning: false
            };
            out.push(currentFlatNode);
            children.forEach(child => {
                const childFlatNodes = this.flatten(nodes, child, level + 1);
                const warningNodes = childFlatNodes.filter(node => node.warning || node.childWarning);
                currentFlatNode.childWarning = currentFlatNode.childWarning || warningNodes.length > 0;
                out = out.concat(childFlatNodes);
            });
        }
        return out;
    }

    getParentNode(node: FlatNode) {
        return this.flatNodes.find(x => x.result.objectId === node.result.parentInstanceId);
    }

    getChildNodes(node: FlatNode) {
        return this.flatNodes.filter(x => x.result.parentInstanceId === node.result.objectId).reduce((children, child) => {
            return children.concat([child], this.getChildNodes(child));
        }, []);
    }

    shouldRender(node: FlatNode) {
        let parent = node;
        while (parent = this.getParentNode(parent)) {
            if (!parent.expanded) {
                return false;
            }
        }
        return true;
    }

    // go through all sr tree nodes and make sure they are visible
    // when their parent is expanded.
    smartNodeVisibilityFullUpdate() {
        const parentIdx: number[] = [];
        for (let i = 0; i < this.flatNodes.length; i++) {
            const node = this.flatNodes[i];
            parentIdx[node.level] = i;
            if (node.level === 0) {
                node.visible = true;
            } else {
                const parentNode = this.flatNodes[parentIdx[node.level - 1]];
                node.visible = parentNode.expanded;
            }
        }
    }

    handleExpanderClick(event: MouseEvent, node: FlatNode) {
        node.expanded = !node.expanded;
        this.expansion[node.result.objectId] = node.expanded;

        if (event.shiftKey) {
            this.getChildNodes(node).forEach(childNode => {
                childNode.expanded = node.expanded;
                this.expansion[childNode.result.objectId] = childNode.expanded;
            });
        }
        this.selection = this.selection.filter(x => this.shouldRender(x));

        event.preventDefault();
        this.store.dispatch(new simulationResultActions.UpdateNodeExpansionState({ simResultId: this.simResultId, expansionState: this.expansion }));
    }

    handleNodeClick(event: MouseEvent, clickedNode: FlatNode) {
        if (event.defaultPrevented) {
            return;
        }

        if (event.shiftKey) {
            const anchor = this.selection[this.selection.length - 1];
            const a = this.flatNodes.indexOf(anchor);
            const b = this.flatNodes.indexOf(clickedNode);
            const start = Math.min(a, b);
            const end = Math.max(a, b);
            for (let i = start; i <= end; i++) {
                const node = this.flatNodes[i];
                if (this.shouldRender(node) && this.selection.indexOf(node) === -1) {
                    this.selection.push(node);
                }
            }
        } else if (event.metaKey || event.ctrlKey) {
            this.selection.push(clickedNode);
        } else {
            this.selection = [clickedNode];
        }
    }

    handleDragStarted(node: FlatNode) {
        if (this.selection.indexOf(node) === -1) {
            this.selection = [node];
        }

    }

    hasResults(node: FlatNode): boolean {
        const aggregatedReportData = node.result.aggregatedReport[this.selectedScenarioId];
        const firstReportDate = aggregatedReportData ? Object.keys(aggregatedReportData)[0] : null;
        const dataContent = aggregatedReportData && firstReportDate ? aggregatedReportData[firstReportDate][this.dataType] : null;
        return dataContent && JSON.stringify(dataContent) !== '{}';
    }

    @HostListener('document:keydown', ['$event'])
    handleKeyDown(event: KeyboardEvent) {
        if (this.isFocused && event.key === 'a' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            const visibleNodes = this.flatNodes.filter(x => this.shouldRender(x));
            if (visibleNodes.length === this.selection.length) {
                this.selection = [].concat(this.flatNodes);
                this.selection.forEach(x => x.expanded = true);
            } else {
                this.selection = visibleNodes;
            }
        }
    }

    @HostListener('document:mousedown', ['$event', '$event.target'])
    mouseDown(mouseDownEvent: MouseEvent, targetElement: HTMLElement) {
        const clickedInside = this.host.nativeElement.contains(targetElement);
        if (clickedInside) {
            this.isFocused = true;
        } else {
            this.isFocused = false;
            this.selection = [];
        }
    }
}
