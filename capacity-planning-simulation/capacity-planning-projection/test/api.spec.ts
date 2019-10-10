import { expect } from 'chai';
import { getMonths } from '../src/date';
import { Variable, Frame, renderProjections, VariableProjections, TimeSegmentBasic, TimeSegmentBreakdown, TimeSegmentExpression, VariableType, Expression, Actual } from '../src/index';




describe("API", () => {
    let validStartDate = "2018-01";
    let validEndDate = "2018-10";
    let invalidStartDate = "xxxxx";
    let invalidEndDate = "yyyyy";

    let basicTestPreStart = "2018-08";
    let basicTestStart = "2018-09";
    let basicTestEnd = "2019-02";
    let basicTestLength = 6;
    let basicTestVariables: Variable[];
    let basicTestDistribution = 10;
    let basicTestActual = 10;

    let expVariableId = "9999";
    let basicVariableId = "1234";
    let bdVariableId = "4567";

    let zeroVariableId = "0000";
    let zeroVariableVal = 0;
    let expZeroVariableId = "9999000";

    let staticDistExpVariableId = "191919";
    let dynamicDistExpVariableId = "9191919";

    let expStaticDistExpVariableId = "20122012";
    let expDynamicDistExpVariableId = "18181818";


    beforeEach("Setting up test variables", () => {
        basicTestVariables = [];
        let x: Variable = new Variable("xobert", "abcede", VariableType.Integer);
        x.addTimeSegment(new TimeSegmentBasic("2017-10", 100, 0.2));
        basicTestVariables.push(x);

        let bd: Variable = new Variable("transportation", bdVariableId, VariableType.Breakdown);
        bd.defaultBreakdown = { "bus": 0.2, "train": 0.5, "car": 0.3 };
        bd.addTimeSegment(new TimeSegmentBreakdown("2018-05", bd.defaultBreakdown));
        basicTestVariables.push(bd);

        let v: Variable = new Variable("passengers", basicVariableId, VariableType.Integer, "tps");
        v.addTimeSegment(new TimeSegmentBasic(basicTestStart, 100, 0.2).addDistribution(basicTestDistribution));
        v.addBreakdownVariable(bd);
        v.addActual(new Actual(basicTestPreStart, basicTestActual));
        basicTestVariables.push(v);

        let bd2: Variable = new Variable("haircut", "4821", VariableType.Breakdown);
        bd2.defaultBreakdown = { "voku": 0.2, "hila": 0.5, "vokuhila": 0.3 };
        bd2.addTimeSegment(new TimeSegmentBreakdown("2018-11", bd2.defaultBreakdown));
        basicTestVariables.push(bd2);

        let vexp = new Variable("multipliedPassengers", expVariableId, VariableType.Integer);
        vexp.addTimeSegment(new TimeSegmentExpression(basicTestStart, Expression.parse("passengers*10", basicTestVariables) as Expression));
        basicTestVariables.push(vexp);

        let vzero: Variable = new Variable("zero", zeroVariableId, VariableType.Integer, "tps");
        vzero.addTimeSegment(new TimeSegmentBasic(basicTestStart, zeroVariableVal));
        basicTestVariables.push(vzero);


        let vexpzero = new Variable("multipliedZero", expZeroVariableId, VariableType.Integer);
        vexpzero.addTimeSegment(new TimeSegmentExpression(basicTestStart, Expression.parse("zero*10", basicTestVariables) as Expression));
        basicTestVariables.push(vexpzero);

        let vdiststaticexp = new Variable("basicDistributionExpression", staticDistExpVariableId, VariableType.Integer);
        vdiststaticexp.addTimeSegment(new TimeSegmentBasic(basicTestStart, 100).addDistribution(Expression.parse("10", basicTestVariables) as Expression));
        basicTestVariables.push(vdiststaticexp);

        let vdistdynamicexp = new Variable("dynamicDistributionExpression", dynamicDistExpVariableId, VariableType.Integer);
        vdistdynamicexp.addTimeSegment(new TimeSegmentBasic(basicTestStart, 100).addDistribution(Expression.parse("passengers", basicTestVariables) as Expression));
        basicTestVariables.push(vdistdynamicexp);

        let vexpdiststaticexp = new Variable("basicDistributionExpression", expStaticDistExpVariableId, VariableType.Integer);
        vexpdiststaticexp.addTimeSegment(new TimeSegmentExpression(basicTestStart, Expression.parse("zero*10", basicTestVariables) as Expression).addDistribution(Expression.parse("10", basicTestVariables) as Expression));
        basicTestVariables.push(vexpdiststaticexp);

        let vexpdistdynamicexp = new Variable("dynamicDistributionExpression", expDynamicDistExpVariableId, VariableType.Integer);
        vexpdistdynamicexp.addTimeSegment(new TimeSegmentExpression(basicTestStart, Expression.parse("zero*10", basicTestVariables) as Expression).addDistribution(Expression.parse("passengers", basicTestVariables) as Expression));
        basicTestVariables.push(vexpdistdynamicexp);

    });

    it("return empty collection when no variables passed in", () => {
        let result = renderProjections([], validStartDate, validEndDate);
        expect(Object.keys(result)).lengthOf(0);
        expect(result).not.instanceOf(Error);
    });
    it("return an error with invalid start date", () => {
        let result = renderProjections([], invalidStartDate, validEndDate);
        expect(result).instanceOf(Error);
    });

    it("return an error with invalid end date", () => {
        let result = renderProjections([], validStartDate, invalidEndDate);
        expect(result).instanceOf(Error);
    });

    it("don't return an error with start and end date being the same", () => {
        let result = renderProjections([], validStartDate, validStartDate);
        expect(result).not.instanceOf(Error);
    });

    it("basic test returns as many variables as passed in", () => {
        let result = renderProjections(basicTestVariables, basicTestStart, basicTestEnd);
        expect(result).not.instanceOf(Error);
        expect(Object.keys(result)).lengthOf(basicTestVariables.length);
    });

    it("basic test returns as many frames as the timesegment is long", () => {
        let result = renderProjections(basicTestVariables, basicTestStart, basicTestEnd);
        expect(result).not.instanceOf(Error);
        let projection = result as VariableProjections;
        for (let varId in projection) {
            let varProj = projection[varId];
            expect(varProj.length).equals(basicTestLength);
        }
    });

    it("should calculate a basic expression depending on a different variable", () => {
        let result = renderProjections(basicTestVariables, basicTestStart, basicTestEnd);
        expect(result).not.instanceOf(Error);
        let projection = result as VariableProjections;
        expect(Object.keys(projection)).lengthOf(basicTestVariables.length);

        let expressionFrames = projection[expVariableId];
        expect(expressionFrames).lengthOf(basicTestLength);
        expect(expressionFrames[0].projectedValue).equals(1000);
        for (let f of expressionFrames) {
            expect(f.projectionCalculationError).equals(undefined);
            expect(f.projectedValue).be.greaterThan(999);
        }
    });

    it("basic test returns basic timesegment with distribution", () => {
        let result = renderProjections(basicTestVariables, basicTestStart, basicTestEnd);
        expect(result).not.instanceOf(Error);
        let projection = result as VariableProjections;
        let basicFrames = projection[basicVariableId];
        expect(basicFrames).lengthOf(basicTestLength);
        for (let f of basicFrames) {
            expect(f.distribution).not.equal(undefined);
            if (f.distribution) {
                expect(f.distribution.stdDev).not.equal(undefined);
                if (f.distribution.stdDev) {
                    expect(f.distribution.stdDev).equal(basicTestDistribution);
                }
            }
        }
    });

    it("should have units in frames of the respective variables", () => {
        let result = renderProjections(basicTestVariables, basicTestStart, basicTestEnd);
        expect(result).not.instanceOf(Error);
        let projection = result as VariableProjections;
        let basicFrames = projection[basicVariableId];
        expect(basicFrames).lengthOf(basicTestLength);
        for (let f of basicFrames) {
            expect(f.unit).equal("tps");
        }
        let bdFrames = projection[bdVariableId];
        expect(bdFrames).lengthOf(basicTestLength);
        for (let f of bdFrames) {
            expect(f.unit).equal(undefined);
        }
    });

    it("should have actuals in frames otherwise empty frames", () => {
        let result = renderProjections(basicTestVariables, basicTestPreStart, basicTestEnd);
        expect(result).not.instanceOf(Error);
        let projection = result as VariableProjections;
        let basicFrames = projection[basicVariableId];
        expect(basicFrames).lengthOf(basicTestLength + 1);
        for (let f of basicFrames) {
            if (f.date === basicTestPreStart) {
                expect(f.actualValue).to.not.equal(undefined);
            } else {
                expect(f.actualValue).to.equal(undefined);
            }
        }
    });

    it("should calculate a basic expression depending on a different variable with zero value", () => {
        let result = renderProjections(basicTestVariables, basicTestStart, basicTestEnd);
        expect(result).not.instanceOf(Error);
        let projection = result as VariableProjections;
        expect(Object.keys(projection)).lengthOf(basicTestVariables.length);

        let expressionFrames = projection[expZeroVariableId];
        expect(expressionFrames).lengthOf(basicTestLength);
        for (let f of expressionFrames) {
            expect(f.projectionCalculationError).equals(undefined);
            expect(f.projectedValue).equals(0);
        }
    });

    it("should calculate a distribution expression with a static value", () => {
        let result = renderProjections(basicTestVariables, basicTestStart, basicTestEnd);
        expect(result).not.instanceOf(Error);
        let projection = result as VariableProjections;
        expect(Object.keys(projection)).lengthOf(basicTestVariables.length);

        let expressionFrames = projection[staticDistExpVariableId];
        expect(expressionFrames).lengthOf(basicTestLength);
        for (let f of expressionFrames) {
            expect(f.distributionCalculationError).equals(undefined);
            expect(f.distribution).to.not.equal(undefined);
            if (f.distribution)
                expect(f.distribution.stdDev).equals(10);
        }
    });

    it("should calculate a distribution expression with a dynamic value", () => {
        let result = renderProjections(basicTestVariables, basicTestStart, basicTestEnd);
        expect(result).not.instanceOf(Error);
        let projection = result as VariableProjections;
        expect(Object.keys(projection)).lengthOf(basicTestVariables.length);

        let expressionFrames = projection[dynamicDistExpVariableId];
        expect(expressionFrames).lengthOf(basicTestLength);
        let valueFrames = projection[basicVariableId];
        expect(valueFrames).lengthOf(basicTestLength);
        for (let i = 0; i < expressionFrames.length; i++) {
            let f = expressionFrames[i];
            expect(f).to.not.equal(undefined);
            let vf = valueFrames[i];
            expect(vf).to.not.equal(undefined);
            expect(f.distributionCalculationError).equals(undefined);
            expect(f.distribution).to.not.equal(undefined);
            if (f.distribution)
                expect(f.distribution.stdDev).equals(vf.projectedValue);
        }
    });


    it("should calculate a distribution expression with a static value on an expression timesegment", () => {
        let result = renderProjections(basicTestVariables, basicTestStart, basicTestEnd);
        expect(result).not.instanceOf(Error);
        let projection = result as VariableProjections;
        expect(Object.keys(projection)).lengthOf(basicTestVariables.length);

        let expressionFrames = projection[expStaticDistExpVariableId];
        expect(expressionFrames).lengthOf(basicTestLength);
        for (let f of expressionFrames) {
            expect(f.distributionCalculationError).equals(undefined);
            expect(f.distribution).to.not.equal(undefined);
            if (f.distribution)
                expect(f.distribution.stdDev).equals(10);
        }
    });

    it("should calculate a distribution expression with a dynamic value on an expression timesegment", () => {
        let result = renderProjections(basicTestVariables, basicTestStart, basicTestEnd);
        expect(result).not.instanceOf(Error);
        let projection = result as VariableProjections;
        expect(Object.keys(projection)).lengthOf(basicTestVariables.length);

        let expressionFrames = projection[expDynamicDistExpVariableId];
        expect(expressionFrames).lengthOf(basicTestLength);
        let valueFrames = projection[basicVariableId];
        expect(valueFrames).lengthOf(basicTestLength);
        for (let i = 0; i < expressionFrames.length; i++) {
            let f = expressionFrames[i];
            expect(f).to.not.equal(undefined);
            let vf = valueFrames[i];
            expect(vf).to.not.equal(undefined);
            expect(f.distributionCalculationError).equals(undefined);
            expect(f.distribution).to.not.equal(undefined);
            if (f.distribution)
                expect(f.distribution.stdDev).equals(vf.projectedValue);
        }
    });
});
