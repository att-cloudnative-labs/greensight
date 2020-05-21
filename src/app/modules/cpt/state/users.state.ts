import { State, Action, StateContext, Selector } from '@ngxs/store';
import { map, tap } from 'rxjs/operators';
import * as usersActions from './users.actions';
import { UserService } from '@cpt/services/user.service';
import { UserGroupService } from '@app/modules/cpt/services/usergroup.service';
import { User } from '@cpt/interfaces/user';
import { UserGroup } from '@app/modules/cpt/interfaces/user-group';
import { append, patch, removeItem, updateItem } from '@ngxs/store/operators';


export class UsersStateModel {
    public users: User[];
    public usergroups: UserGroup[];
    public currentUser: User;
}

@State<UsersStateModel>({
    name: 'users',
    defaults: {
        currentUser: {
            username: '',
            password: '',
            id: '',
            role: '',
            userGroupId: '',
            settings: null
        },
        users: [],
        usergroups: []
    }
})
export class UsersState {
    constructor(private userService: UserService,
        private usergroupService: UserGroupService
    ) { }

    @Selector()
    static users(state: UsersStateModel) {
        return state.users;
    }

    @Selector()
    static usergroups(state: UsersStateModel) {
        return state.usergroups;
    }

    @Selector()
    static currentUser(state: UsersStateModel) {
        return state.currentUser;
    }

    @Selector()
    static currentUserIsAdmin(state: UsersStateModel) {
        return state.currentUser.role === 'ADMIN';
    }


    @Action(usersActions.GetUsers)
    getUsers(
        { patchState }: StateContext<UsersStateModel>) {
        return this.userService
            .getUsers()
            .pipe(
                map((response: any) => {
                    patchState({
                        users: response.data as User[],
                    });
                })
            );
    }

    @Action(usersActions.GetUsergroups)
    getUsergroups(
        { patchState }: StateContext<UsersStateModel>) {
        return this.usergroupService
            .getUserGroup()
            .pipe(
                map((response: any) => {
                    patchState({
                        usergroups: response.data as UserGroup[],
                    });
                })
            );
    }

    @Action(usersActions.GetCurrentUser)
    getCurrentUser(
        { patchState }: StateContext<UsersStateModel>) {
        return this.userService.getLoggedInUser()
            .pipe(
                map((response: any) => {
                    patchState({
                        currentUser: response.data as User,
                    });
                })
            );
    }

    @Action(usersActions.UserDelete)
    deleteUser(ctx: StateContext<UsersStateModel>, { payload: { userId } }: usersActions.UserDelete) {
        return this.userService.deleteUser(userId).pipe(tap(() => {
            ctx.setState(patch({ users: removeItem<User>(u => u.id === userId) }));
            // FIXME: update usergroups as well?
        }));
    }

    @Action(usersActions.UserAdd)
    addUser(ctx: StateContext<UsersStateModel>, { payload: { userName, newPassword } }: usersActions.UserAdd) {
        return this.userService.createUser(userName, newPassword, 'READ_ONLY').pipe(tap((newUser) => {
            ctx.setState(patch({ users: append<User>([newUser]) }));
        }));
    }

    @Action(usersActions.UserUpdateRole)
    updateUserRole(ctx: StateContext<UsersStateModel>, { payload: { userId, role } }: usersActions.UserUpdateRole) {
        const user = ctx.getState().users.find(u => u.id === userId);
        const updatedUser: User = { ...user, role: role };
        return this.userService.updateUser(userId, updatedUser.username, role, updatedUser.settings).pipe(tap(() => {
            ctx.setState(patch({ users: updateItem<User>(u => u.id === userId, updatedUser) }));
        }));
    }

    @Action(usersActions.UserUpdatePassword)
    updateUserPassword(ctx: StateContext<UsersStateModel>, { payload: { userId, newPassword } }: usersActions.UserUpdatePassword) {
        const user = ctx.getState().users.find(u => u.id === userId);
        return this.userService.updateUser(userId, user.username, user.role, user.settings, newPassword);
    }

    @Action(usersActions.UserGroupAdd)
    addGroup(ctx: StateContext<UsersStateModel>, { payload: { userGroupName } }: usersActions.UserGroupAdd) {
        return this.usergroupService.createUsergroup(userGroupName, [], 'READ_ONLY').pipe(tap((ug) => {
            ctx.setState(patch({ usergroups: append([ug]) }));
        }));
    }

    @Action(usersActions.UserGroupDelete)
    deleteGroup(ctx: StateContext<UsersStateModel>, { payload: { userGroupId } }: usersActions.UserGroupDelete) {
        return this.usergroupService.deleteUsergroup(userGroupId).pipe(tap(() => {
            ctx.setState(patch({ usergroups: removeItem(ug => ug.id === userGroupId) }));
        }));
    }

    @Action(usersActions.UserGroupUpdateRole)
    updateGroupRole(ctx: StateContext<UsersStateModel>, { payload: { userGroupId, role } }: usersActions.UserGroupUpdateRole) {
        const userGroup = ctx.getState().usergroups.find(ug => ug.id === userGroupId);
        const updatedUserGroup: UserGroup = { ...userGroup, roleId: role };
        return this.usergroupService.updateUsergroup(updatedUserGroup.id, updatedUserGroup.userGroupName, updatedUserGroup.usersWithAccess, role).pipe(tap(() => {
            ctx.setState(patch({ usergroups: updateItem<UserGroup>(ug => ug.id === userGroupId, updatedUserGroup) }));
        }));
    }

    @Action(usersActions.UserGroupAddUser)
    addGroupMembers(ctx: StateContext<UsersStateModel>, { payload: { userGroupId, userId } }: usersActions.UserGroupAddUser) {
        const userGroup = ctx.getState().usergroups.find(ug => ug.id === userGroupId);
        const newuser = ctx.getState().users.find(u => u.id === userId);
        const updatedUserGroup: UserGroup = { ...userGroup, usersWithAccess: [...userGroup.usersWithAccess, newuser] };
        return this.usergroupService.updateUsergroup(updatedUserGroup.id, updatedUserGroup.userGroupName, updatedUserGroup.usersWithAccess, updatedUserGroup.roleId).pipe(tap(() => {
            ctx.setState(patch({ usergroups: updateItem<UserGroup>(ug => ug.id === userGroupId, updatedUserGroup) }));
        }));
    }

    @Action(usersActions.UserGroupRemoveUser)
    removeGroupMember(ctx: StateContext<UsersStateModel>, { payload: { userGroupId, userId } }: usersActions.UserGroupRemoveUser) {
        const userGroup = ctx.getState().usergroups.find(ug => ug.id === userGroupId);
        const updatedUserGroup: UserGroup = { ...userGroup, usersWithAccess: userGroup.usersWithAccess.filter(u => u.id !== userId) };
        return this.usergroupService.updateUsergroup(updatedUserGroup.id, updatedUserGroup.userGroupName, updatedUserGroup.usersWithAccess, updatedUserGroup.roleId).pipe(tap(() => {
            ctx.setState(patch({ usergroups: updateItem<UserGroup>(ug => ug.id === userGroupId, updatedUserGroup) }));
        }));
    }


}
