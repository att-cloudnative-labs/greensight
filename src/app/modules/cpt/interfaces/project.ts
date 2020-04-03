import { User } from '../../login/interfaces/user';
import { UserGroup } from './user-group';
import { TreeNode, TreeNodeAccessControlMode, TreeNodeUserPermissions } from './tree-node';



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
