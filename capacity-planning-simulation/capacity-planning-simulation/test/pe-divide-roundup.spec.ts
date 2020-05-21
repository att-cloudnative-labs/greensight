import * as chai from 'chai';
import { expect } from 'chai';
import { describe, beforeEach, it } from 'mocha';
import { genTestParent, generatePeProcess, genTestEnvironment, makeNum, makeAspectNumber } from "./test-util";
import { CptPeDivideRoundup, CptPeDivideRoundupDescription } from '../src/processing-elements/cpt-pe-divide-roundup';

import { NumberParam, Aspect } from "@cpt/capacity-planning-simulation-types";

describe("Processing Element: Divide & Round Up", () => {
    let testParent = genTestParent();
    let testProcess = generatePeProcess(CptPeDivideRoundupDescription);
    let testEnv = genTestEnvironment()
    let pe: CptPeDivideRoundup;
    let aspect: Aspect = {
        name: 'devices',
        slices: { 'android': 40, 'ios': 60 }
    }

    before("setting up chai", () => {
        chai.should();
    });

    beforeEach("", () => {
        pe = new CptPeDivideRoundup(testProcess, testParent);
        pe.init(testEnv);
    });

    it("should instantiate fine", () => {
        pe.should.be.instanceof(CptPeDivideRoundup);
    });

    it("should init", () => {
        pe.init(testEnv).should.equal(true);
    });

    it("should divide", () => {
        pe.acceptLoad(makeNum(2), pe.INPORT_NUMERATOR_ID);
        pe.acceptLoad(makeNum(2), pe.INPORT_DIVISOR_ID);
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        result.should.have.property("type");
        result.type.should.equal("NUMBER");
        result.value.should.equal(1);
    });

    it("shouldn't divide by zero", () => {
        pe.acceptLoad(makeNum(2), pe.INPORT_NUMERATOR_ID);
        pe.acceptLoad(makeNum(0), pe.INPORT_DIVISOR_ID);
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        expect(result).to.equal(null);
    });

    it("should have numerator BDs on output", () => {
        pe.acceptLoad(makeAspectNumber(4, aspect), pe.INPORT_NUMERATOR_ID);
        pe.acceptLoad(makeNum(2), pe.INPORT_DIVISOR_ID);
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        expect(result).to.not.equal(null);
        result.should.have.property("type");
        result.type.should.equal("NUMBER");
        let aspectResult = result as NumberParam;
        aspectResult.value.should.equal(2);
        aspectResult.aspects.length.should.equal(1);
        let resultAspect = aspectResult.aspects[0];
        resultAspect.name.should.equal(aspect.name);
    });

    it("shouldn't have divisor BDs on output", () => {
        pe.acceptLoad(makeNum(4), pe.INPORT_NUMERATOR_ID);
        pe.acceptLoad(makeAspectNumber(2, aspect), pe.INPORT_DIVISOR_ID);
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        result.should.have.property("type");
        result.type.should.equal("NUMBER");
        result.value.should.equal(2);
    });
});
