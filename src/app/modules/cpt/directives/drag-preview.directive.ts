import { Directive, TemplateRef } from '@angular/core';

@Directive({
    selector: 'ng-template[appDragPreview]'
})
export class DragPreviewDirective<T = any> {
    constructor(public templateRef: TemplateRef<T>) { }
}
