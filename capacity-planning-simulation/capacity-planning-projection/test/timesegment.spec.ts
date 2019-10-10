import { expect } from 'chai'
import { TimeSegmentBasic, GrowthType, TimeSegmentBreakdown, TimeSegmentExpression } from "../src/timesegment";
import { FrameRenderContext, Frame, VariableRenderState } from "../src/frame";
import { Variable, Breakdown, VariableType } from '../src/variable';
import { Distribution, DistributionType } from '../src/distribution';
import { Expression } from '../src/expression';
import jsep = require('jsep');


let testTimeSegment: TimeSegmentBasic

describe("TimeSegmentBasic", () => {
    let testVar = new Variable("testvar", "testvar-id", VariableType.Real);
    beforeEach("set up test data", () => {
        testTimeSegment = new TimeSegmentBasic("2018-09", 3000);
    });

    it("should increase projected value if growth is applied", () => {
        testTimeSegment.growthType = GrowthType.Exponential;
        testTimeSegment.growth = 0.5;
        const result: Frame = testTimeSegment.calculate("2018-12", testVar, new FrameRenderContext([]));
        expect(result.projectedValue).greaterThan(testTimeSegment.value);
    });
});

describe("TimeSegmentBreakdown", () => {
    let testVar = new Variable("testvar", "testvar-id", VariableType.Real);
    let breakdownSubVars: Breakdown;
    let testTimeSegment: TimeSegmentBreakdown;
    let frameRenderContext: FrameRenderContext;

    beforeEach("set up test breakdown Time Segment", () => {
        breakdownSubVars = { "ios": 0.5, "android": 0.3, "roku": 0.2 };
        testTimeSegment = new TimeSegmentBreakdown("2018-10", breakdownSubVars)
        frameRenderContext = new FrameRenderContext([]);
    });

    it("should calculate subframes for each subVariable", () => {
        const result: Frame = testTimeSegment.calculate("2018-10", testVar, frameRenderContext);
        expect(result.subFrames).to.exist.and.to.have.length(Object.keys(breakdownSubVars).length);
    });
});



describe("TimeSegmentExpression", () => {

    let testDate = "2018-01";
    let singleMonthFutureTestDate = "2018-02";
    let twoMonthFutureTestDate = "2018-03";
    let expr = jsep("var1+var2");
    let dexpr = jsep("d(var1)+d(var2)");
    let staticExpr = jsep("100+100");
    let idRefs = { "var1": "var1-id", "var2": "var2-id" };
    let dummyVariable = new Variable("dummy", "dummy-id", VariableType.Real);
    let frame1 = new Frame(testDate);
    frame1.projectedValue = 100;
    frame1.distribution = { distributionType: DistributionType.Gaussian, stdDev: 10 };
    let renderState1 = new VariableRenderState(dummyVariable);
    renderState1.f = frame1;

    let frame2 = new Frame(testDate);
    frame2.projectedValue = 10;
    frame2.distribution = { distributionType: DistributionType.Gaussian, stdDev: 5 };
    let renderState2 = new VariableRenderState(dummyVariable);
    renderState2.f = frame2;


    let refValues = { "var1-id": 10, "var2-id": 100 };
    let frameRenderContext: FrameRenderContext = new FrameRenderContext([]);
    frameRenderContext.renderState["var1-id"] = renderState1;
    frameRenderContext.renderState["var2-id"] = renderState2;

    it("should add variable values", () => {
        let basicExpression = Expression.create(expr, idRefs);
        let ts = new TimeSegmentExpression(testDate, basicExpression as Expression);
        let f = ts.calculate(testDate, dummyVariable, frameRenderContext);
        expect(f.projectedValue).equals(110);
    });

    it("should add static values", () => {
        let staticExpression = Expression.create(staticExpr, idRefs);
        let ts = new TimeSegmentExpression(testDate, staticExpression as Expression);
        let f = ts.calculate(testDate, dummyVariable, frameRenderContext);
        expect(f.projectedValue).equals(200);
    });

    it("shouldn't add growth on non-static expressions", () => {
        let basicExpression = Expression.create(expr, idRefs);
        let ts = new TimeSegmentExpression(testDate, basicExpression as Expression, 0.5);
        let f = ts.calculate(singleMonthFutureTestDate, dummyVariable, frameRenderContext);
        expect(f.projectedValue).equals(110);
    });

    it("should add growth on a static expressions", () => {
        let staticExpression = Expression.create(staticExpr, idRefs);
        let ts = new TimeSegmentExpression(testDate, staticExpression as Expression, 0.5);
        let f = ts.calculate(singleMonthFutureTestDate, dummyVariable, frameRenderContext);
        expect(f.projectedValue).equals(300);
    });

    it("should add more growth on a two month static expressions", () => {
        let staticExpression = Expression.create(staticExpr, idRefs);
        let ts = new TimeSegmentExpression(testDate, staticExpression as Expression, 0.5);
        let f = ts.calculate(twoMonthFutureTestDate, dummyVariable, frameRenderContext);
        expect(f.projectedValue).equals(450);
    });

    it("should calculate auto distribution ", () => {
        let basicExpression = Expression.create(expr, idRefs);
        let ts = new TimeSegmentExpression(testDate, basicExpression as Expression).addDistribution("auto");
        let f = ts.calculate(testDate, dummyVariable, frameRenderContext);
        expect(f.distributionCalculationError).undefined;
        expect(f.distribution).not.undefined;
        if (f.distribution) {
            expect(f.distribution.stdDev).within(11.1803, 11.1804);
        }
    });
    it("should calculate distribution expression from projected values", () => {
        let basicExpression = Expression.create(expr, idRefs);
        expect(basicExpression).instanceOf(Expression);
        let basicDistributionExpression = Expression.create(expr, idRefs);
        expect(basicDistributionExpression).instanceOf(Expression);

        let ts = new TimeSegmentExpression(testDate, basicExpression as Expression).addDistribution(basicDistributionExpression as Expression);
        let f = ts.calculate(testDate, dummyVariable, frameRenderContext);
        expect(f.distributionCalculationError).undefined;
        expect(f.distribution).not.undefined;
        if (f.distribution) {
            expect(f.distribution.stdDev).equals(110);
        }
    });

    it("should calculate distribution expression from distribution values", () => {
        let basicExpression = Expression.create(expr, idRefs);
        expect(basicExpression).instanceOf(Expression);
        let basicDistributionExpression = Expression.create(dexpr, idRefs);
        expect(basicDistributionExpression).instanceOf(Expression);

        let ts = new TimeSegmentExpression(testDate, basicExpression as Expression).addDistribution(basicDistributionExpression as Expression);
        let f = ts.calculate(testDate, dummyVariable, frameRenderContext);
        expect(f.distributionCalculationError).undefined;
        expect(f.distribution).not.undefined;
        if (f.distribution) {
            expect(f.distribution.stdDev).equals(15);
        }
    });
});
