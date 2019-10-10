import { Component, OnInit, Input, ViewChild, ViewContainerRef, ComponentFactoryResolver, OnChanges, SimpleChanges } from '@angular/core';
import { Panel } from '@system-models/state/layout.state';
import { dockableComponentsMap } from '@system-models/components/dockable-components';


@Component({
    selector: 'app-dockable-panel',
    templateUrl: './dockable-panel.component.html',
    styleUrls: ['./dockable-panel.component.css']
})
export class DockablePanelComponent implements OnChanges {
    @Input() panel: Panel;
    @Input() hidden: boolean;
    @ViewChild('componentHost', { read: ViewContainerRef }) componentViewContainerRef;
    private componentRef;

    constructor(
        private componentFactoryResolver: ComponentFactoryResolver
    ) {
    }

    ngOnChanges(changes: SimpleChanges) {
        if (this.changesShouldInvalidate(changes) && this.panel.component) {
            this.loadComponent(this.panel.component);
        }
        if (this.hidden) {
            this.componentRef._component.disableUserInput();
        } else {
            this.componentRef._component.enableUserInput();
        }
    }

    private changesShouldInvalidate(changes: SimpleChanges) {
        return (
            changes['panel']
            && (
                !changes['panel'].previousValue
                || changes['panel'].previousValue.id !== changes['panel'].currentValue.id
            )
        );
    }

    loadComponent(componentName) {
        const componentFactory = this.componentFactoryResolver.resolveComponentFactory(dockableComponentsMap[componentName]);
        this.componentViewContainerRef.clear();
        this.componentRef = this.componentViewContainerRef.createComponent(componentFactory);
        if (this.panel.args) {
            Object.keys(this.panel.args).forEach(k => {
                this.componentRef.instance[k] = this.panel.args[k];
            });
        }
    }
}
