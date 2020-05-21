import { User } from './user';

export interface UserGroup {
    id: string;
    userGroupName: string;
    usersWithAccess: Array<User>;
    roleId: string;
}
