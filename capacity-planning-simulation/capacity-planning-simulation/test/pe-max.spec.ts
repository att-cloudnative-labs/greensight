import * as chai from 'chai';
import { describe, beforeEach, it } from 'mocha';
import { genTestParent, generatePeProcess, genTestEnvironment, makeNum, makeAspectNumber } from "./test-util";
import { CptPeMaxDescription, CptPeMax } from '../src/processing-elements/cpt-pe-max';
import { Aspect, NumberParam } from '@cpt/capacity-planning-simulation-types';


describe("Processing Element: Max", () => {
    let testParent = genTestParent();
    let testProcess = generatePeProcess(CptPeMaxDescription);
    let testEnv = genTestEnvironment()
    let pe: CptPeMax;
    let basicAspect: Aspect = {
        name: 'platform',
        slices: { 'android': 100, 'ios': 20 }
    }

    before("setting up chai", () => {
        chai.should();
    });

    beforeEach("", () => {
        pe = new CptPeMax(testProcess, testParent);
        pe.init(testEnv);
    });

    it("should instantiate fine", () => {
        pe.should.be.instanceof(CptPeMax);
    });

    it("should init", () => {
        pe.init(testEnv).should.equal(true);
    });

    it("should return maximum value", () => {
        pe.acceptLoad(makeNum(20), pe.INPORT_A_ID);
        pe.acceptLoad(makeNum(1), pe.INPORT_B_ID);
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        result.should.have.property("type");
        result.type.should.equal("NUMBER");
        result.value.should.equal(20);
    });

    it("should return breakdowns of input that has maximum value", () => {
        pe.acceptLoad(makeAspectNumber(50, basicAspect), pe.INPORT_A_ID);
        pe.acceptLoad(makeNum(10), pe.INPORT_B_ID);
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        result.should.have.property("type");
        result.type.should.equal("NUMBER");
        result.value.should.equal(50);
        let asn = result as NumberParam;
        asn.aspects.length.should.equal(1);
    });

    it("should not return breakdowns of inputs that are not the maximum value", () => {
        pe.acceptLoad(makeAspectNumber(1, basicAspect), pe.INPORT_A_ID);
        pe.acceptLoad(makeNum(50), pe.INPORT_B_ID);
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        result.should.have.property("type");
        result.type.should.equal("NUMBER");
        result.should.not.have.property("aspects");
    });
});
