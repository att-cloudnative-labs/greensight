import { Component, Input, Output, EventEmitter } from '@angular/core';
import { VariableType } from '@cpt/capacity-planning-projection/lib';
import { ForecastVariable } from '@app/modules/cpt/interfaces/forecast-variable';

@Component({
    selector: 'associate-breakdown',
    templateUrl: './associate.breakdown.component.html',
    styleUrls: ['./associate.breakdown.component.css']
})

export class AssociateBreakdownVariableComponent {
    @Input('variable') variable: ForecastVariable;
    @Input('allVariables') allVariables: Array<ForecastVariable>;
    @Output('associationChange') associationChange = new EventEmitter();

    get associatedBreakdownVariables(): ForecastVariable[] {
        return (this.variable.content.breakdownIds || []).map(breakdownId => {
            return this.allVariables.find(forecastVariable => forecastVariable.id === breakdownId);
        });
    }

    get availableBreakdownVariables(): ForecastVariable[] {
        const list = this.allVariables
            .filter(forecastVariable => {
                return forecastVariable.content.variableType === VariableType.Breakdown && forecastVariable.id !== this.variable.id;
            });
        // return list.sort((a, b) => (a.title > b.title) ? 1 : -1);
        return list;
    }

    handleCheck(event, forecastVariable) {
        if (event.target.checked) {
            this.associationChange.emit(
                this.associatedBreakdownVariables.concat([forecastVariable])
            );
        } else {
            this.associationChange.emit(
                this.associatedBreakdownVariables.filter(afv => afv.id !== forecastVariable.id)
            );
        }
    }
}
