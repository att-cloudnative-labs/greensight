import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SystemModelsPageComponent } from './components/system-models-page/system-models-page.component';
import { SettingsComponent } from '@app/modules/cpt/components/settings/settings.component';

const routes: Routes = [
    { path: '', component: SystemModelsPageComponent },
    { path: 'settings', component: SettingsComponent }

];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class CptRoutingModule { }
