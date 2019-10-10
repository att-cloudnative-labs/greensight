import * as chai from 'chai';
import { describe, beforeEach, it } from 'mocha';
import { expect, should } from 'chai';

import { getPeRepository, CptProcessingElement, CptSimulationProcessIf, buildProcessingElement } from '../src/index';
import { CptPeSerialExecution, CptPeSerialExecutionDescription } from '../src/processing-elements/cpt-pe-serial-execution'
import { Inport, Outport, ProcessInterfaceDescription, ProcessPortTemplate, Process, NumberParam } from '../types/src/index';
import { genTestParent, generatePeProcess, genTestEnvironment, makeNum, makeBool } from './test-util';
import { makeLatencyResponse } from '../src/cpt-response-ops';



describe("Processing Element: Serial Execution", () => {
    let testParent = genTestParent();
    let testProcess = generatePeProcess(CptPeSerialExecutionDescription);
    let testEnv = genTestEnvironment()
    let pe: CptPeSerialExecution;

    before("setting up chai", () => {
        chai.should();
    });

    beforeEach("", () => {
        pe = new CptPeSerialExecution(testProcess, testParent);
        pe.init(testEnv);
    });

    it("should instantiate fine", () => {
        pe.should.be.instanceof(CptPeSerialExecution);
    });

    it("should init", () => {
        pe.init(testEnv).should.equal(true);
    });

    it("should forward load", () => {
        pe.acceptLoad(makeNum(100), pe.INPORT_LOAD_ID);
        pe.process();
        let loadA = pe.yieldLoad(pe.OUTPORT_A_ID);
        let loadB = pe.yieldLoad(pe.OUTPORT_B_ID);
        expect(loadA).to.not.equal(null);
        expect(loadB).to.not.equal(null);
        loadA.type.should.equal('NUMBER');
        loadB.type.should.equal('NUMBER');
        loadA.value.should.equal(100);
        loadB.value.should.equal(100);
    });

    it("should forward a single response from port A", () => {
        pe.process();
        pe.acceptResponse(makeLatencyResponse(100), pe.OUTPORT_A_ID);
        pe.processResponse();
        let response = pe.yieldResponse(pe.INPORT_LOAD_ID);
        expect(response).to.not.equal(null);
        response.should.have.property("type");
        response.type.should.equal("RESPONSE_NUMBER");
        response.value.should.equal(100);
    });

    it("should forward a single response from port B", () => {
        pe.process();
        pe.acceptResponse(makeLatencyResponse(100), pe.OUTPORT_B_ID);
        pe.processResponse();
        let response = pe.yieldResponse(pe.INPORT_LOAD_ID);
        expect(response).to.not.equal(null);
        response.should.have.property("type");
        response.type.should.equal("RESPONSE_NUMBER");
        response.value.should.equal(100);
    });

    it("add up responses from A & B", () => {
        pe.process();
        pe.acceptResponse(makeLatencyResponse(100), pe.OUTPORT_A_ID);
        pe.acceptResponse(makeLatencyResponse(100), pe.OUTPORT_B_ID);
        pe.processResponse();
        let response = pe.yieldResponse(pe.INPORT_LOAD_ID);
        expect(response).to.not.equal(null);
        response.should.have.property("type");
        response.type.should.equal("RESPONSE_NUMBER");
        response.value.should.equal(200);

    });
});
