import {
    renderProjections, renderProjectionsCsv, Variable, VariableType,
    TimeSegmentBasic, TimeSegmentBreakdown,
    TimeSegmentExpression, Actual, Expression
} from '../index';

let variables: Variable[] = [];
let expVariableId = "varexp-id";
let bd: Variable = new Variable("transportation", "bd1-id", VariableType.Breakdown);
bd.defaultBreakdown = { "bus": 0.2, "train": 0.5, "car": 0.3 };
bd.addTimeSegment(new TimeSegmentBreakdown("2018-05", bd.defaultBreakdown));
variables.push(bd);


let bd2: Variable = new Variable("haircut", "bd2-id", VariableType.Breakdown);
bd2.defaultBreakdown = { "voku": 0.2, "hila": 0.5, "vokuhila": 0.3 };
bd2.addTimeSegment(new TimeSegmentBreakdown("2018-05", bd2.defaultBreakdown));
variables.push(bd2);

let v: Variable = new Variable("passengers", "var-id", VariableType.Integer, "tps");
v.addTimeSegment(new TimeSegmentBasic("2018-09", 100, 0.2).addDistribution(10));


v.addBreakdownVariable(bd);
v.addBreakdownVariable(bd2);
v.addActual(new Actual("2018-10", 100));
variables.push(v);

let v2: Variable = new Variable("days", "var2-id", VariableType.Integer);
v2.addTimeSegment(new TimeSegmentBasic("2018-09", 15, 0.04).addDistribution(5));
variables.push(v2);

let vexp = new Variable("multipliedPassengers", expVariableId, VariableType.Real);
let distributionExpression = Expression.parse("d(passengers)*10", variables);
if (distributionExpression instanceof Error) {
    console.log("failed to create distribution expression:" + distributionExpression.message);
} else {
    console.log(JSON.stringify(distributionExpression));
    vexp.addTimeSegment(new TimeSegmentExpression("2018-09", Expression.parse("passengers*days", variables) as Expression).addDistribution(distributionExpression));
}

let tsx = new TimeSegmentExpression("2018-12", Expression.parse("passengers*days", variables) as Expression).addDistribution("auto");
console.log(JSON.stringify(tsx));
vexp.addTimeSegment(tsx);

let reparse = Variable.deserialize(JSON.parse(JSON.stringify(vexp)));

console.log(JSON.stringify(vexp));
console.log(JSON.stringify(reparse));
variables.push(reparse as Variable);


let projections = renderProjections(variables, "2018-09", "2019-02");

console.log(JSON.stringify(projections));

console.log("");
let projectionsCsv = renderProjectionsCsv(variables, "2018-09", "2019-02");
console.log(projectionsCsv);
