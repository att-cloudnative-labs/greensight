import { expect } from 'chai'
import { FrameRenderContext, Frame, SubFrame } from '../src/frame';
import { Variable, VariableType } from '../src/variable';
import { TimeSegment, TimeSegmentMethod } from '../src/timesegment';

let testVariable: Variable;
let frameRenderCtx: FrameRenderContext;

describe("Frame", () => {
    it("should push subframe", () => {
        const frame: Frame = new Frame("2018-09");
        frame.addSubframe("testSubFrame", 60);
        expect(frame.subFrames).to.have.lengthOf(1);
    });
});

describe("FrameRenderContext", () => {
    beforeEach("Setting up test variable", () => {
        testVariable = new Variable("testVar", "testId", VariableType.Integer);
        frameRenderCtx = new FrameRenderContext([testVariable]);
    });

    it("should add variable to render state on initialization", () => {
        expect(frameRenderCtx.renderState[testVariable.id]).not.undefined;
    });

    it("should push frame", () => {
        frameRenderCtx.pushFrame(testVariable, new Frame("2018-09"));
        expect(frameRenderCtx.renderState[testVariable.id].f).not.undefined;
    });

    it("should push timesegment", () => {
        frameRenderCtx.pushTimesegment(testVariable, new TimeSegment(TimeSegmentMethod.Basic, "2018-09"));
        expect(frameRenderCtx.renderState[testVariable.id].ts).not.undefined;
    });

});
