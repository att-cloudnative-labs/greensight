import { UserRole } from '@cpt/interfaces/role';
import { User } from '@cpt/interfaces/user';

export class GetUsers {
    static readonly type = '[Users] Retrieve Users';
}

export class GetUsergroups {
    static readonly type = '[Users]  Retrieve Usergroups';
}



export class GetCurrentUser {
    static readonly type = '[Users]  Retrieve Current user';
}

export class UserEditorButtonClicked {
    static readonly type = '[Users] User Editor Clicked';
}

export class UserGroupEditorButtonClicked {
    static readonly type = '[Users] User Group Editor Clicked';
}

export class UserUpdatePassword {
    static readonly type = '[Users] Update Password';
    constructor(public readonly payload: { userId: string, newPassword: string }) { }
}

export class UserUpdateRole {
    static readonly type = '[Users] Update Role';
    constructor(public readonly payload: { userId: string, role: UserRole }) { }
}


export class UserAdd {
    static readonly type = '[Users] Add User';
    constructor(public readonly payload: { userName: string, newPassword: string }) { }
}

export class UserDelete {
    static readonly type = '[Users] Delete User';
    constructor(public readonly payload: { userId: string }) { }

}

export class UserGroupAdd {
    static readonly type = '[Users] Add User Group';
    constructor(public readonly payload: { userGroupName: string }) { }
}

export class UserGroupDelete {
    static readonly type = '[Users] Delete User Group';
    constructor(public readonly payload: { userGroupId: string }) { }
}

export class UserGroupUpdateRole {
    static readonly type = '[Users] Update User Group Role';
    constructor(public readonly payload: { userGroupId: string, role: UserRole }) { }
}

export class UserGroupAddUser {
    static readonly type = '[Users] Update User Group Add User';
    constructor(public readonly payload: { userGroupId: string, userId: String }) { }
}
export class UserGroupRemoveUser {
    static readonly type = '[Users] Update User Group Remove User';
    constructor(public readonly payload: { userGroupId: string, userId: String }) { }
}

