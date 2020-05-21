import { LayoutState } from './layout.state';
import { LibraryState } from './library.state';
import { TreeState } from './tree.state';
import { TrashState } from './trash.state';
import { HistoryState } from './history.state';
import { ProcessingElementState } from './processing-element.state';
import { UsersState } from './users.state';
import { SelectionState } from './selection.state';
import { ForecastValuesState } from './forecast-values.state';
import { SRSState } from './simulation-result-screen.state';
import { ClipboardState } from './clipboard.state';
import { ReleaseState } from './release.state';
import { TreeNodeTrackingState } from '@cpt/state/tree-node-tracking.state';
import { ApplicationState } from '@cpt/state/application.state';
import { GraphModelInterfaceState } from '@cpt/state/graph-model-interface.state';
import { SettingsState } from '@cpt/state/settings.state';
import { VariableUnitState } from '@cpt/state/variable-unit.state';

export const states = [
    ForecastValuesState,
    LayoutState,
    LibraryState,
    ProcessingElementState,
    TreeState,
    TrashState,
    HistoryState,
    UsersState,
    SelectionState,
    SRSState,
    ClipboardState,
    ReleaseState,
    TreeNodeTrackingState,
    ApplicationState,
    GraphModelInterfaceState,
    SettingsState,
    VariableUnitState
];
