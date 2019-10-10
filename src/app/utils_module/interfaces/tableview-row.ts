import { TableViewColumn } from './tableview-column';
import { User } from '../../core_module/interfaces/user';
import { TreeNode, TreeNodeAccessControlMode, TreeNodeAccessControlListEntry } from '@app/core_module/interfaces/tree-node';


export class TableViewRow {
    id: String;
    columns: TableViewColumn[] = Array<TableViewColumn>();

    accessControlMode: TreeNodeAccessControlMode;

    accessControl: string;

    isPrivate = false;

    public treeNode: TreeNode;


    constructor(id: String) {
        this.id = id;
    }

    addColumn(item: TableViewColumn) {
        this.columns.push(item);
    }

    public setAccessControlMode(mode: TreeNodeAccessControlMode) {
        this.accessControlMode = mode;
    }

    public setAccessControlPermissions(permissions: TreeNodeAccessControlListEntry[]) {

    }

}
