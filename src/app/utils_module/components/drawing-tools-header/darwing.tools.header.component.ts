import { Component, OnInit, Output, Input, EventEmitter } from '@angular/core';


@Component({
    selector: 'app-drawing-tools-header',
    templateUrl: './darwing.tools.header.component.html',
    styleUrls: ['./darwing.tools.header.component.css']
})

export class DrawingToolsHeaderComponent implements OnInit {

    @Output('zoom-in') zoomInEvent = new EventEmitter();
    @Output('zoom-out') zoomOutEvent = new EventEmitter();
    @Output('export') exportEvent = new EventEmitter();
    @Output('save') saveEvent = new EventEmitter();
    @Output('cancel') cancelEvent = new EventEmitter();
    @Output('verify') verifyEvent = new EventEmitter();
    @Output('input-value') inputTemplate = new EventEmitter();
    @Output('start-group-selection') selectGroupEvent = new EventEmitter();
    @Output('stop-group-selection') stopSelectGroupEvent = new EventEmitter();
    @Output('group') groupEvent = new EventEmitter();
    @Output('ungroup') ungroupEvent = new EventEmitter();
    @Output('copy-group') copyGroupEvent = new EventEmitter();
    @Output('delete-group') deleteGroupEvent = new EventEmitter();

    @Input('showModifyButtons') showModifyButtons = true;
    public sTemplateDisabled = false;
    public siTemplateDisabled = false;
    public gmsTemplateDisabled = false;
    public jmsTemplateDisabled = false;
    public ipTemplateDisabled = false;


    public circleTemplateDisabled = false;
    public diamondTemplateDisabled = false;
    public triangleTemplateDisabled = false;
    public squareTemplateDisabled = false;
    public labelTemplateDisabled = false;

    public zoomInDisabled = false;
    public zoomOutDisabled = false;

    @Input('pointer-disabled') pointerDisabled = false;
    @Input('group-disabled') groupDisabled = true;

    @Input('ungroup-disabled') ungroupDisabled = true;
    @Input('copy-group-disabled') copyGroupDisabled = true;
    @Input('delete-group-disabled') deleteGroupDisabled = true;

    // TODO: enable export, save, cancel and verify
    public exportDisabled = true;
    public saveDisabled = true;
    public cancelDisabled = true;
    public verifyDisabled = true;

    constructor() { }

    ngOnInit() {
        $(document).ready(function() {
            ($('[data-toggle="tooltip"]') as any).tooltip();
        });
    }

    public setartSelectionForGroup() {
        if (this.pointerDisabled) {
            this.stopSelectGroupEvent.emit();
            this.pointerDisabled = false;

            this.groupDisabled = true;
            this.ungroupDisabled = false;
            this.sTemplateDisabled = false;
        } else {
            this.selectGroupEvent.emit();
            this.pointerDisabled = true;

            this.groupDisabled = false;
            this.ungroupDisabled = true;
            this.sTemplateDisabled = true;
        }
    }

    public group() {
        this.groupEvent.emit();

        this.pointerDisabled = false;

        this.groupDisabled = true;
        this.ungroupDisabled = true;
        this.sTemplateDisabled = false;
    }

    public ungroup() {
        this.ungroupEvent.emit();

        this.pointerDisabled = false;

        this.groupDisabled = true;
        this.ungroupDisabled = true;
        this.sTemplateDisabled = false;
    }

    public copyGroup() {
        this.copyGroupEvent.emit();
    }

    public deleteGroup() {
        this.deleteGroupEvent.emit();
    }

    public drawInputTemplate() {
        this.inputTemplate.emit();
    }

    public export(event) {
        this.exportEvent.emit(event);
    }

    public save(event) {
        this.saveEvent.emit(event);
    }

    public cancel() {
        this.cancelEvent.emit();
    }

    public verify(event) {
        this.verifyEvent.emit(event);
    }

    public zoomIn() {
        this.zoomInEvent.emit();
    }

    public zoomOut() {
        this.zoomOutEvent.emit();
    }
}
