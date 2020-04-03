import { Component, OnInit, ViewChild, ViewContainerRef, OnDestroy, ComponentFactoryResolver } from '@angular/core';
import { Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { untilDestroyed } from 'ngx-take-until-destroy';

import { SelectionState } from '@app/modules/cpt/state/selection.state';
import { detailsPanelComponentsMap } from '@app/modules/cpt/components/details/details-panel-components';

@Component({
    selector: 'app-details',
    templateUrl: './details.component.html',
    styleUrls: ['./details.component.css']
})
export class DetailsComponent implements OnInit, OnDestroy {
    static TYPE_TO_COMPONENT_NAME = {
        'TreeNode': 'TreeNodeDetailsComponent',
        'Inport': 'GmInportDetailsComponent',
        'Outport': 'GmOutportDetailsComponent',
        'ProcessInport': 'GmProcessInportDetailsComponent',
        'ProcessOutport': 'GmProcessOutportDetailsComponent',
        'Process': 'GmProcessDetailsComponent',
        'VariableReference': 'GmVariableReferenceDetailsComponent',
        'VariableCell': 'TreeNodeDetailsComponent'
    };

    @ViewChild('componentHost', { read: ViewContainerRef, static: true }) componentViewContainerRef;
    @Select(SelectionState.withNodes) selection$: Observable<any>;

    constructor(
        private componentFactoryResolver: ComponentFactoryResolver
    ) { }

    ngOnInit() {
        this.selection$.pipe(untilDestroyed(this)).subscribe(selection => {
            // for now only show if there's exactly one selected item
            const selected = selection && selection.length === 1 && selection[0];
            if (selected && selected.object) {
                const componentName = DetailsComponent.TYPE_TO_COMPONENT_NAME[selected.type];
                if (componentName) {
                    this.loadComponent(componentName, selected);
                } else {
                    this.clearComponent();
                }

            } else {
                this.clearComponent();
            }
        });
    }

    /*
    * This lifecycle handler must be defined in order for untilDestroyed to work correctly
    */
    ngOnDestroy() { }

    loadComponent(componentName, selected) {
        const component = detailsPanelComponentsMap[componentName];
        if (component) {
            const componentFactory = this.componentFactoryResolver.resolveComponentFactory(component);
            this.componentViewContainerRef.clear();
            const componentRef = this.componentViewContainerRef.createComponent(componentFactory);
            componentRef.instance.selected = selected;
        } else {
            console.error(`Details component not found for ${selected.type}`);
            this.clearComponent();
        }
    }

    clearComponent() {
        this.componentViewContainerRef.clear();
    }

    enableUserInput() {

    }

    disableUserInput() {

    }
}
