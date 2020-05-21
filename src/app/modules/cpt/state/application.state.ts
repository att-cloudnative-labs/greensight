import { Action, Selector, State, StateContext } from '@ngxs/store';
import { ApplicationReady } from '@cpt/state/application.actions';
import { LoaderService } from '@login/services/loader.service';
import { SettingsStateModel } from '@cpt/state/settings.state';

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

    constructor(private loaderService: LoaderService) {
    }

    @Selector()
    static ready(state: ApplicationStateModel) {
        return state.ready;
    }

    @Action(ApplicationReady)
    setApplicationReady(
        ctx: StateContext<ApplicationStateModel>) {
        ctx.setState({ ready: true });
        this.loaderService.hide();
    }

}
