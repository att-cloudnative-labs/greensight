import { Component, Input, HostListener, ElementRef, OnChanges } from '@angular/core';
import { SimulationResult } from '@cpt/capacity-planning-simulation-types';

@Component({
    selector: 'app-sr-error-warning-list',
    templateUrl: './sr-error-warning-list.component.html',
    styleUrls: ['./sr-error-warning-list.component.css']
})
export class SrErrorWarningListComponent implements OnChanges {
    @Input() result: SimulationResult;
    isFocused: boolean;
    errorWarningNodes = [];
    selection = [];

    constructor(private host: ElementRef) { }

    ngOnChanges() {
        this.errorWarningNodes = this.getErrorWarnings();
    }

    getErrorWarnings() {
        const errorWarningNodes = Object.values(this.result.nodes).filter((x) => {
            return (
                x.type === 'PROCESSING_ELEMENT'
                && (x.ref === '41c22bcb-f966-406a-8814-a7b8e187b508' || x.ref === 'e3cc50a9-795c-4a47-8643-6d0aee39b49c')
                && (x.aggregatedReport || x.subNodeInstanceIds));
        });
        return errorWarningNodes.map(node => ({ result: node, dataType: 'data' }));
    }

    handleNodeClick(event: MouseEvent, clickedNode) {
        if (event.defaultPrevented) {
            return;
        }

        if (event.shiftKey) {
            const anchor = this.selection[this.selection.length - 1];
            const a = this.errorWarningNodes.indexOf(anchor);
            const b = this.errorWarningNodes.indexOf(clickedNode);
            const start = Math.min(a, b);
            const end = Math.max(a, b);
            for (let i = start; i <= end; i++) {
                const node = this.errorWarningNodes[i];
                if (this.selection.indexOf(node) === -1) {
                    this.selection.push(node);
                }
            }
        } else if (event.metaKey || event.ctrlKey) {
            this.selection.push(clickedNode);
        } else {
            this.selection = [clickedNode];
        }
    }

    handleDragStarted(node) {
        if (this.selection.indexOf(node) === -1) {
            this.selection = [node];
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
