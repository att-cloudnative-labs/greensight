import { Injectable, TemplateRef, ViewContainerRef } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { Subscription, fromEvent } from 'rxjs';
import { take, filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class Popover {
    sub: Subscription;
    overlayRef: OverlayRef | null;
    onClose = () => { };

    constructor(private overlay: Overlay) { }

    open(
        origin,
        templateRef: TemplateRef<any>,
        containerRef: ViewContainerRef,
        options = {
            closeOnAnyClick: true,
            onClose: () => { }
        }
    ) {
        this.close();
        this.onClose = options.onClose;
        const positionStrategy = this.overlay.position()
            .flexibleConnectedTo(origin)
            .withPositions([
                {
                    originX: 'end',
                    originY: 'bottom',
                    overlayX: 'start',
                    overlayY: 'top',
                }
            ]);

        this.overlayRef = this.overlay.create({
            positionStrategy,
            hasBackdrop: true,
            backdropClass: 'app-popover',
            scrollStrategy: this.overlay.scrollStrategies.reposition()
        });


        this.overlayRef.backdropClick().subscribe(() => this.close());

        this.overlayRef.attach(new TemplatePortal(templateRef, containerRef, {
            close: this.close.bind(this)
        }));

        // Close popover when escape key is pressed
        this.sub = fromEvent<KeyboardEvent>(document, 'keydown')
            .pipe(
                filter(event => {
                    return event.key === 'Escape';
                }),
                take(1)
            ).subscribe(() => this.close());
    }

    close() {
        if (this.sub) {
            this.sub.unsubscribe();
        }
        if (this.overlayRef) {
            this.overlayRef.dispose();
            this.overlayRef = null;
        }
        this.onClose.call(this);
        this.onClose = () => { };
    }
}
