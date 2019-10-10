import { User } from './user';
import { UserGroup } from './user-group';
import { TreeNode, TreeNodeAccessControlMode, TreeNodeUserPermissions } from '../interfaces/tree-node';



export interface Project {
    id?: string;
    title: string;
    description?: string;
    ownerName?: String;
    ownerId?: String;
    isPrivate?: Boolean;
    usersWithAccess?: Array<User>;
    userGroups?: Array<UserGroup>;
    _treeNode?: TreeNode;
    _accessMode?: TreeNodeAccessControlMode;
    _permissions?: TreeNodeUserPermissions[];

}
