import * as chai from 'chai';
import { describe, beforeEach, it } from 'mocha';

import { CptPeRemoveAspect, CptPeRemoveAspectDescription } from '../src/processing-elements/cpt-pe-remove-aspect';
import { Aspect } from '@cpt/capacity-planning-simulation-types';
import { genTestParent, generatePeProcess, genTestEnvironment, makeNum, makeAspectNumber, makeBool } from './test-util';


describe("Processing Element: Remove Aspect", () => {
    let testParent = genTestParent();
    let testProcess = generatePeProcess(CptPeRemoveAspectDescription);
    let testEnv = genTestEnvironment()
    let pe: CptPeRemoveAspect;
    let basicAspect: Aspect = {
        name: 'platform',
        slices: { 'android': 100, 'ios': 20 }
    }

    before("setting up chai", () => {
        chai.should();
    });

    beforeEach("", () => {
        pe = new CptPeRemoveAspect(testProcess, testParent);
        pe.init(testEnv);
    });

    it("should instantiate fine", () => {
        pe.should.be.instanceof(CptPeRemoveAspect);
    });

    it("should init", () => {
        pe.init(testEnv).should.equal(true);
    });

    it("should return load without a breakdown when a breakdown is set", () => {
        pe.acceptLoad(makeAspectNumber(10, basicAspect), pe.INPORT_ID);
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        result.should.have.property("type");
        result.type.should.equal("NUMBER");
        result.value.should.equal(10);
    });

    it("should return load without a breakdown when no breakdown is set", () => {
        pe.acceptLoad(makeNum(10), pe.INPORT_ID);
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        result.should.have.property("type");
        result.type.should.equal("NUMBER");
        result.value.should.equal(10);
    });

    it("should just forward loads without breakdown", () => {
        pe.acceptLoad(makeBool(true), pe.INPORT_ID);
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        result.should.have.property("type");
        result.type.should.equal("BOOLEAN");
        result.value.should.equal(true);
    });

});
