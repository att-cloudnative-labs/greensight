import * as chai from 'chai';
import { describe, beforeEach, it } from 'mocha';
import { expect, should } from 'chai';

import { getPeRepository, CptProcessingElement, CptSimulationProcessIf, buildProcessingElement } from '../src/index';
import { CptPeConditional, CptPeConditionalDescription } from '../src/processing-elements/cpt-pe-conditional'
import { Inport, Outport, ProcessInterfaceDescription, ProcessPortTemplate, Process, NumberParam } from '../types/src/index';
import { genTestParent, generatePeProcess, genTestEnvironment, makeNum, makeBool } from './test-util';


describe("Processing Element: Conditional", () => {
    let testParent = genTestParent();
    let testProcess = generatePeProcess(CptPeConditionalDescription);
    let testEnv = genTestEnvironment()
    let pe: CptPeConditional;

    before("setting up chai", () => {
        chai.should();
    });

    beforeEach("", () => {
        pe = new CptPeConditional(testProcess, testParent);
        pe.init(testEnv);
    });

    it("should instantiate fine", () => {
        pe.should.be.instanceof(CptPeConditional);
    });

    it("should init", () => {
        pe.init(testEnv).should.equal(true);
    });

    it("should forward true port if switch is true", () => {
        pe.acceptLoad(makeBool(true), pe.INPORT_SWITCH_ID);
        pe.acceptLoad(makeNum(1), pe.INPORT_TRUE_ID);
        pe.acceptLoad(makeNum(2), pe.INPORT_FALSE_ID);
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        result.should.have.property("type");
        result.type.should.equal("NUMBER");
        result.value.should.equal(1);
    });

    it("should forward false port if switch is false", () => {
        pe.acceptLoad(makeBool(false), pe.INPORT_SWITCH_ID);
        pe.acceptLoad(makeNum(1), pe.INPORT_TRUE_ID);
        pe.acceptLoad(makeNum(2), pe.INPORT_FALSE_ID);
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        result.should.have.property("type");
        result.type.should.equal("NUMBER");
        result.value.should.equal(2);
    });

    it("should forward nothing if switch value is not boolean", () => {
        pe.acceptLoad(makeNum(1), pe.INPORT_SWITCH_ID);
        pe.acceptLoad(makeNum(1), pe.INPORT_TRUE_ID);
        pe.acceptLoad(makeNum(2), pe.INPORT_FALSE_ID);
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        expect(result).to.equal(null);
    });

});
