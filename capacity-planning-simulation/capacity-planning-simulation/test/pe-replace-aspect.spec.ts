import * as chai from 'chai';
import { describe, beforeEach, it } from 'mocha';
import { CptPeReplaceAspect, CptPeReplaceAspectDescription } from '../src/processing-elements/cpt-pe-replace-aspect';
import { Aspect, NumberParam } from '@cpt/capacity-planning-simulation-types';
import { genTestParent, generatePeProcess, genTestEnvironment, makeAspectNumber } from './test-util';


describe("Processing Element: Replace Aspect", () => {
    let testParent = genTestParent();
    let testProcess = generatePeProcess(CptPeReplaceAspectDescription);
    let testEnv = genTestEnvironment()
    let pe: CptPeReplaceAspect;

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
        pe = new CptPeReplaceAspect(testProcess, testParent);
        pe.init(testEnv);
    });

    it("should instantiate fine", () => {
        pe.should.be.instanceof(CptPeReplaceAspect);
    });

    it("should init", () => {
        pe.init(testEnv).should.equal(true);
    });

    it("should remove aspect without extra aspect input", () => {
        pe.acceptLoad(makeAspectNumber(1, firstAspect), pe.INPORT_LOAD_ID);
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        result.should.have.property("type");
        result.type.should.equal("NUMBER");
        result.value.should.equal(1);
    });

    it("should replace aspect with aspect input", () => {
        pe.acceptLoad(makeAspectNumber(1, firstAspect), pe.INPORT_LOAD_ID);
        pe.acceptLoad({ type: 'ASPECT', value: secondAspect }, pe.INPORT_ASPECT_ID);
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        result.should.have.property("type");
        result.type.should.equal("NUMBER");
        result.value.should.equal(1);
        let asn = result as NumberParam;
        asn.aspects.length.should.equal(1);
        let a = asn.aspects[0];
        a.name.should.equal(secondAspect.name);
    });

    it("should replace aspect with aspect num input", () => {
        pe.acceptLoad(makeAspectNumber(1, firstAspect), pe.INPORT_LOAD_ID);
        pe.acceptLoad(makeAspectNumber(10, secondAspect), pe.INPORT_ASPECT_ID);
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        result.should.have.property("type");
        result.type.should.equal("NUMBER");
        result.value.should.equal(1);
        let asn = result as NumberParam;
        asn.aspects.length.should.equal(1);
        let a = asn.aspects[0];
        a.name.should.equal(secondAspect.name);
    });

});
