import { Directive, Input, TemplateRef, ViewContainerRef, OnDestroy, OnChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { PermissionsObject } from '@app/shared/interfaces/permissions';

@Directive({
    selector: '[appHasPermission]'
})
export class HasPermissionDirective implements OnDestroy, OnChanges {
    @Input('appHasPermission') permissionsObject: PermissionsObject;
    private subscription: Subscription;

    hasPermission = false;

    constructor(private viewContainer: ViewContainerRef, private templateRef: TemplateRef<any>) { }

    ngOnChanges() {
        this.viewContainer.clear();
        this.hasPermission = this.permissionsObject.accessObject.currentUserAccessPermissions.includes(this.permissionsObject.permissions);
        if (this.hasPermission) {
            this.viewContainer.createEmbeddedView(this.templateRef);
        }
    }

    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }
}
