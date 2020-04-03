import { State, Action, StateContext, Selector } from '@ngxs/store';
import { map } from 'rxjs/operators';
import * as usersActions from './users.actions';
import { UserService } from '@app/modules/login/services/user.service';
import { UserGroupService } from '@app/modules/cpt/services/usergroup.service';
import { User } from '@app/modules/login/interfaces/user';
import { UserGroup } from '@app/modules/cpt/interfaces/user-group';


export class UsersStateModel {
    public users: User[];
    public usergroups: UserGroup[];
}

@State<UsersStateModel>({
    name: 'users',
    defaults: {
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
}