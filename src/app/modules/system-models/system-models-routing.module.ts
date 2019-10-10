import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SystemModelsPageComponent } from './components/system-models-page/system-models-page.component';

const routes: Routes = [
    { path: '', component: SystemModelsPageComponent },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class SystemModelsRoutingModule { }
