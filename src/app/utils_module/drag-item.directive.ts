import { Directive, HostListener, ViewContainerRef, ContentChild, ElementRef, OnDestroy, EmbeddedViewRef, Input, Output, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';

import { DragPreviewDirective } from './drag-preview.directive';
import { DragDropRegistryService } from './drag-drop-registry.service';
import { DropListDirective } from './drop-list.directive';

function removeElement(element: HTMLElement | null) {
    if (element && element.parentNode) {
        element.parentNode.removeChild(element);
    }
}

@Directive({
    selector: '[appDragItem]'
})
export class DragItemDirective implements OnDestroy {
    @Input('appDragItemData') data: any;
    @Output('appDragStarted') dragStarted: EventEmitter<DragItemDirective> = new EventEmitter();
    @ContentChild(DragPreviewDirective) previewTemplate: DragPreviewDirective;
    private previewElement: HTMLElement | null;
    private previewRef: EmbeddedViewRef<any> | null;
    private pointerMoveSubscription = Subscription.EMPTY;
    private pointerUpSubscription = Subscription.EMPTY;
    private activeDropList: DropListDirective | null;
    private wasDragging = false;

    constructor(
        private element: ElementRef<HTMLElement>,
        private vcr: ViewContainerRef,
        private dragDropRegistry: DragDropRegistryService
    ) { }

    ngOnDestroy() {
        this.removeSubscriptions();
    }

    @HostListener('mousedown', ['$event'])
    mouseDown(event) {
        $(document).on(`mousemove.drag-item`, (moseMoveEvent) => {
            this.startDrag(moseMoveEvent.originalEvent as MouseEvent);
            this.dragStarted.next(this);
            $(document).off(`mousemove.drag-item`);
        });
    }

    @HostListener('mouseup', ['$event'])
    mouseUp(event) {
        $(document).off(`mousemove.drag-item`);
    }

    @HostListener('click', ['$event'])
    click(event) {
        if (this.wasDragging) {
            event.preventDefault();
        }
        this.wasDragging = false;
    }

    private startDrag(event: MouseEvent) {
        this.previewElement = this.createPreviewElement();
        this.previewElement.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;

        // If we wanted to support a mode other than copy, we'd set this.element.nativeElement.style.display = 'none' here
        document.body.appendChild(this.previewElement);
        this.dragDropRegistry.startDragging(this, event);
        this.pointerMoveSubscription = this.dragDropRegistry.pointerMove.subscribe(this.pointerMove);
        this.pointerUpSubscription = this.dragDropRegistry.pointerUp.subscribe(this.pointerUp);
    }

    private pointerMove = (event: MouseEvent) => {
        this.previewElement.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
        this.updateActiveDropList({ x: event.clientX, y: event.clientY });
    }

    private pointerUp = (event: MouseEvent) => {
        this.wasDragging = true;
        this.removeSubscriptions();
        this.cleanupDragArtifacts();
        this.dragDropRegistry.stopDragging(this, event);
        if (this.activeDropList) {
            this.activeDropList.drop(this);
            this.activeDropList = null;
        }
    }

    private removeSubscriptions() {
        this.pointerMoveSubscription.unsubscribe();
        this.pointerUpSubscription.unsubscribe();
    }

    private updateActiveDropList({ x, y }) {
        const newDropList = this.dragDropRegistry.getDropListUnder({ x, y });

        // exited old
        if (this.activeDropList && newDropList !== this.activeDropList) {
            this.activeDropList.exit();
        }

        // entered new
        if (newDropList && newDropList !== this.activeDropList) {
            newDropList.enter();
        }

        this.activeDropList = newDropList;
    }

    private cleanupDragArtifacts() {
        if (this.previewElement) {
            removeElement(this.previewElement);
        }

        if (this.previewRef) {
            this.previewRef.destroy();
        }

        this.previewElement = this.previewRef = null;
    }

    private createPreviewElement(): HTMLElement {
        let preview;
        if (this.previewTemplate) {
            this.previewRef = this.vcr.createEmbeddedView(this.previewTemplate.templateRef);
            preview = this.previewRef.rootNodes[0];
        } else {
            // Create one based on the element itself
        }

        preview.style.pointerEvents = 'none';
        preview.style.position = 'fixed';
        preview.style.top = '10px';
        preview.style.left = '8px';
        preview.style.zIndex = '1000';
        preview.classList.add('app-drag-preview');

        return preview;
    }
}
