import { User } from '../../login/interfaces/user';

export interface UserGroup {
    id: String;
    userGroupName: String;
    usersWithAccess: Array<User>;
    roleId: String;
}
