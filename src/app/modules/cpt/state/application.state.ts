import { Action, Actions, State, StateContext } from '@ngxs/store';
import { ApplicationReady } from '@cpt/state/application.actions';
import * as clipboardActions from '@cpt/state/clipboard.actions';
import produce from 'immer';
import { ClipboardStateModel } from '@cpt/state/clipboard.state';

export class ApplicationStateModel {
    ready: boolean;
}

@State<ApplicationStateModel>({
    name: 'application',
    defaults: {
        ready: false
    }
})

export class ApplicationState {

    @Action(ApplicationReady)
    setApplicationReady(
        ctx: StateContext<ApplicationStateModel>) {
        ctx.setState({ ready: true });
    }

}
