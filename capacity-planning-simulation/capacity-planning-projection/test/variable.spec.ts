import { expect } from 'chai'
import { Variable, VariableType, Actual } from '../src/variable';
import { TimeSegment, TimeSegmentMethod, TimeSegmentBasic } from '../src/timesegment';

let testVariable: Variable;
let testActuals: Actual[];

describe("Variable", () => {
    beforeEach("Setting up test variable", () => {
        testVariable = new Variable("testVar", "12345", VariableType.Integer);
        testActuals = [{ date: "2018-09", value: 100 }, { date: "2018-10", value: 140 }, { date: "2018-11", value: 300 }];
    });

    it("should add actuals", () => {
        const newActual: Actual = new Actual("2018-12", 201);
        testVariable.actuals = testActuals;
        testVariable.addActual(newActual);
        expect(testVariable.actuals.length).to.eq(4);
        expect(testVariable.actuals).contain(newActual);
    });

    it("should replace actual that has same date", () => {
        const newActual: Actual = new Actual("2018-09", 500);
        testVariable.actuals = testActuals;
        testVariable.addActual(newActual);
        expect(testVariable.actuals.length).to.eq(3);
        expect(testVariable.actuals).contain(newActual);
    });

    it("should add time segment", () => {
        const testTimeSegment = new TimeSegmentBasic("2019-01", 3000);
        testVariable.timeSegments = [];
        testVariable.addTimeSegment(testTimeSegment);
        expect(testVariable.timeSegments.length).to.eq(1);
        expect(testVariable.timeSegments).contain(testTimeSegment);
    });

    it("should not add breakdown on breakdown variables", () => {
        testVariable.variableType = VariableType.Breakdown;
        testVariable.addBreakdownVariable("testBdId");
        expect(testVariable.breakdownIds).undefined;
    });

    it("should add breakdowns to non breakdown variables", () => {
        testVariable.addBreakdownVariable("testBdId");
        expect(testVariable.breakdownIds).not.undefined;
        expect(testVariable.breakdownIds).contain("testBdId");
    });

});
