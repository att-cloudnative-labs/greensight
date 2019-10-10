import { renderProjections, Variable, VariableType } from 'capacity-planning-projection';

let variables: Variable[] = [];

variables.push(new Variable("var1", "1234", VariableType.Integer));

let projections = renderProjections(variables, "2018-09", "2019-02");
