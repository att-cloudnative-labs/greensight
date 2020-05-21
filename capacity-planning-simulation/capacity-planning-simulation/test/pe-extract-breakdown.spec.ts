import * as chai from 'chai';
import { describe, beforeEach, it } from 'mocha';
import { expect, should } from 'chai';


import { genTestParent, generatePeProcess, genTestEnvironment, makeAspectNumber, makeString, makeNum } from './test-util';
import { CptPeExtractBreakdownDescription, CptPeExtractBreakdown } from '../src/processing-elements/cpt-pe-extract-breakdown';
import { Aspect } from '@cpt/capacity-planning-simulation-types';


describe("Processing Element: Extract Breakdown", () => {
    let testParent = genTestParent();
    let testProcess = generatePeProcess(CptPeExtractBreakdownDescription);
    let testEnv = genTestEnvironment()
    let pe: CptPeExtractBreakdown;

    let firstAspect: Aspect = {
        name: 'platform',
        slices: { 'android': 100, 'ios': 20 }
    }

    let secondAspect: Aspect = {
        name: 'seasons',
        slices: { 'winter': 25, 'spring': 25, 'summer': 25, 'autumn': 25 }
    }


    before("setting up chai", () => {
        chai.should();
    });

    beforeEach("", () => {
        pe = new CptPeExtractBreakdown(testProcess, testParent);
        pe.init(testEnv);
    });

    it("should instantiate fine", () => {
        pe.should.be.instanceof(CptPeExtractBreakdown);
    });

    it("should init", () => {
        pe.init(testEnv).should.equal(true);
    });

    it("should return first aspect if no aspect name specified", () => {
        pe.acceptLoad(makeAspectNumber(1, [firstAspect, secondAspect]), pe.INPORT_LOAD_ID);
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        result.should.have.property("type");
        result.type.should.equal("ASPECT");
        let aspect = result.value as Aspect;
        aspect.name.should.equal("platform");
    });

    it("should return aspect with specified name", () => {
        pe.acceptLoad(makeAspectNumber(1, [firstAspect, secondAspect]), pe.INPORT_LOAD_ID);
        pe.acceptLoad(makeString("seasons"), pe.INPORT_ASPECT_NAME_ID);
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        result.should.have.property("type");
        result.type.should.equal("ASPECT");
        let aspect = result.value as Aspect;
        aspect.name.should.equal("seasons");
    });

    it("should return nothing if load doesnt have a breakdown", () => {
        pe.acceptLoad(makeNum(1), pe.INPORT_LOAD_ID);
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        expect(result).to.equal(null);
    });

    it("should return nothing if load doesnt have a breakdown with specified name", () => {
        pe.acceptLoad(makeAspectNumber(1, [firstAspect, secondAspect]), pe.INPORT_LOAD_ID);
        pe.acceptLoad(makeString("networkType"), pe.INPORT_ASPECT_NAME_ID);
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        expect(result).to.equal(null);
    });
});
