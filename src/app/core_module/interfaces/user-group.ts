import { User } from './user';

export interface UserGroup {
    id: String;
    userGroupName: String;
    usersWithAccess: Array<User>;
    roleId: String;
}
