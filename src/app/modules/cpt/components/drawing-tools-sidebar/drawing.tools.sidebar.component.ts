import { Component, Output, OnInit, EventEmitter } from '@angular/core';

@Component({
    selector: 'app-drawing-tools-sidebar',
    templateUrl: './drawing.tools.sidebar.component.html',
    styleUrls: ['./drawing.tools.sidebar.component.css']
})
export class DrawingToolsSidebarComponent implements OnInit {
    @Output('static-template') staticTemplate = new EventEmitter();
    @Output('single-inheritance-template') singleInheritanceTemplate = new EventEmitter();
    @Output('micro-service-template') MicroServiceTemplate = new EventEmitter();
    @Output('shape-circle') shapeCircle = new EventEmitter();
    @Output('shape-diamond') shapeDiamond = new EventEmitter();
    @Output('shape-triangle') shapeTriangle = new EventEmitter();
    @Output('shape-square') shapeSquare = new EventEmitter();
    @Output('shape-label') shapeLabel = new EventEmitter();
    @Output('save') saveEvent = new EventEmitter();
    @Output('cancel') cancelEvent = new EventEmitter();
    @Output('verify') verifyEvent = new EventEmitter();
    @Output('input-value') inputTemplate = new EventEmitter();
    @Output('ec2-component-template') ec2ComponentTemplate = new EventEmitter();
    @Output('av-service-template') avServiceTemplate = new EventEmitter();
    @Output('loadbalancer-template') loadBalancerTemplate = new EventEmitter();


    constructor() { }

    ngOnInit() {
        $(document).ready(function() {
            ($('[data-toggle="tooltip"]') as any).tooltip();
        });
    }

    public drawInputTemplate() {
        this.inputTemplate.emit();
    }

    public drawStaticTemplate() {
        this.staticTemplate.emit();
    }

    public drawSingleInheritance() {
        this.singleInheritanceTemplate.emit();
    }

    public drawMicroService() {
        this.MicroServiceTemplate.emit();
    }

    public drawEc2ComponentTemplate() {
        this.ec2ComponentTemplate.emit();
    }

    public drawAVServiceTemplate() {
        this.avServiceTemplate.emit();
    }

    public drawLoadBalancerTemplate() {
        this.loadBalancerTemplate.emit();
    }

    public drawCircle() {
        this.shapeCircle.emit();
    }

    public drawDiamond() {
        this.shapeDiamond.emit();
    }

    public drawTriangle() {
        this.shapeTriangle.emit();
    }

    public drawSquare() {
        this.shapeSquare.emit();
    }

    public drawLabel() {
        this.shapeLabel.emit();
    }
}
