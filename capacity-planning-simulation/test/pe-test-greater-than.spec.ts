import * as chai from 'chai';
import { describe, beforeEach, it } from 'mocha';
import { expect, should } from 'chai';

import { getPeRepository, CptProcessingElement, CptSimulationProcessIf, buildProcessingElement } from '../src/index';
import { CptPeTestGreaterThan, CptPeTestGreaterThanDescription } from '../src/processing-elements/cpt-pe-test-greater-than'
import { Inport, Outport, ProcessInterfaceDescription, ProcessPortTemplate, Process, NumberParam } from '../types/src/index';
import { genTestParent, generatePeProcess, genTestEnvironment, makeNum } from './test-util';


describe("Processing Element: Test Greater Than", () => {
    let testParent = genTestParent();
    let testProcess = generatePeProcess(CptPeTestGreaterThanDescription);
    let testEnv = genTestEnvironment()
    let pe: CptPeTestGreaterThan;

    before("setting up chai", () => {
        chai.should();
    });

    beforeEach("", () => {
        pe = new CptPeTestGreaterThan(testProcess, testParent);
        pe.init(testEnv);
    });

    it("should instantiate fine", () => {
        pe.should.be.instanceof(CptPeTestGreaterThan);
    });

    it("should init", () => {
        pe.init(testEnv).should.equal(true);
    });

    function checkResult(num1: number, num2: number, expectedResult: boolean) {
        pe.acceptLoad(makeNum(num1), pe.INPORT_A_ID);
        pe.acceptLoad(makeNum(num2), pe.INPORT_B_ID);
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        result.should.have.property("type");
        result.type.should.equal("BOOLEAN");
        result.value.should.equal(expectedResult);
    }

    it("should yield true if greater", () => {
        checkResult(2, 1, true);
    });

    it("should yield false if smaller", () => {
        checkResult(1, 2, false);
    });

    it("should yield false if equal", () => {
        checkResult(1, 1, false);
    });

});
