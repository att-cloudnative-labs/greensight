import { OnInit, Component, Input, HostListener, ViewChild, TemplateRef, ViewContainerRef, OnDestroy } from '@angular/core';
import { Store, Select, Actions, ofActionSuccessful } from '@ngxs/store';
import { Observable } from 'rxjs';
import { LibraryState } from '@system-models/state/library.state';
import * as libraryActions from '@system-models/state/library.actions';
import { TreeNode } from '@app/core_module/interfaces/tree-node';
import * as treeActions from '@system-models/state/tree.actions';
import { LibraryComponent } from '@system-models/components/library/library.component';
import { Popover } from '@app/shared/services/popover.service';
import { PermissionsObject } from '@app/shared/interfaces/permissions';
import { SelectionState, Selection } from '@system-models/state/selection.state';
import { untilDestroyed } from 'ngx-take-until-destroy';

@Component({
    selector: 'app-library-graph-model-template',
    templateUrl: './library-graph-model-template.component.html',
    styleUrls: ['./library-graph-model-template.component.css']
})
export class LibraryGraphModelTemplateComponent implements OnInit, OnDestroy {
    @Input() graphModelTemplate: TreeNode;
    @Select(SelectionState) selection$: Observable<Selection[]>;
    @Select(LibraryState.renameId) renameId$: Observable<string>;
    @ViewChild('modelTemplateElement') modelTemplateElement;
    @ViewChild('contextMenu') contextMenu: TemplateRef<any>;

    isSelected = false;
    isRename = false;
    hovering = false;
    showPopup = false;
    modifyPermissionsObj: PermissionsObject;

    constructor(private store: Store, private libraryComponent: LibraryComponent, private actions$: Actions,
        private popover: Popover, private viewContainerRef: ViewContainerRef) { }

    ngOnInit() {
        this.modifyPermissionsObj = { permissions: 'MODIFY', accessObject: this.graphModelTemplate };

        this.selection$.pipe(untilDestroyed(this)).subscribe(selection => {
            this.isSelected = !!selection.find(x => x.id === this.graphModelTemplate.id);

            if (this.isSelected) {
                //this.libraryComponent.scrollToNode(this.modelTemplateElement);
            }
        });

        this.renameId$.subscribe(id => {
            this.isRename = id === this.graphModelTemplate.id;
        });

        this.actions$
            .pipe(ofActionSuccessful(treeActions.CreateTreeNode))
            .subscribe((node) => {
                if (node.payload.id === this.graphModelTemplate.id) {
                    this.openModelTemplateRenameMode();
                }
            });
    }

    ngOnDestroy() { }

    @HostListener('dblclick') doubleClick() {
        // TODO: Storing panel names this way makes them prone to breakage if the underlying object name changes
        this.store.dispatch(new libraryActions.GraphModelTemplateDoubleClicked(this.graphModelTemplate));
    }

    get isHighlighted() {
        return this.hovering;
    }

    onClick() {
        if (!this.isRename) {
            this.store.dispatch(new libraryActions.GraphModelTemplateClicked(this.graphModelTemplate));
        }
    }

    onMouseEnter() {
        this.hovering = true;
    }

    onMouseLeave() {
        if (this.showPopup === false) {
            this.hovering = false;
        }
    }

    renameGraphModelTemplate(newName: string) {
        if (newName !== this.graphModelTemplate.name) {
            this.store.dispatch(new libraryActions.RenameGraphModelTemplateCommitted(
                {
                    nodeId: this.graphModelTemplate.id,
                    newName: newName
                }
            ));
        }
        this.store.dispatch(new libraryActions.RenameGraphModelTemplateEscaped());
    }

    togglePopup(event) {
        event.stopPropagation();
        this.showPopup = !this.showPopup;
    }

    openModelTemplateRenameMode() {
        if (this.isSelected) {
            this.isSelected = false;
        }
        this.store.dispatch(new libraryActions.RenameGraphModelTemplateClicked(this.graphModelTemplate));
    }

    onCancelRename() {
        this.store.dispatch(new libraryActions.RenameGraphModelTemplateEscaped());
    }

    openContextMenu(event) {
        event.stopPropagation();
        event.preventDefault();
        this.store.dispatch(new libraryActions.GraphModelTemplateContextMenuOpened(this.graphModelTemplate));
        this.popover.open({ x: event.x, y: event.y }, this.contextMenu, this.viewContainerRef);
    }
}
