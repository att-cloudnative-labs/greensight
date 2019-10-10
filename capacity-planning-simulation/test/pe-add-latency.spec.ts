import * as chai from 'chai';
import { describe, beforeEach, it } from 'mocha';
import { expect, should } from 'chai';

import { getPeRepository, CptProcessingElement, CptSimulationProcessIf, buildProcessingElement } from '../src/index';
import { CptPeAddLatency, CptPeAddLatencyDescription } from '../src/processing-elements/cpt-pe-addlatency'
import { makeLatencyResponse } from '../src/cpt-response-ops';
import { Inport, Outport, ProcessInterfaceDescription, ProcessPortTemplate, Process, NumberParam } from '../types/src/index';
import { genTestParent, generatePeProcess, genTestEnvironment, makeNum, makeBool, } from './test-util';


describe("Processing Element: Add Latency", () => {
    let testParent = genTestParent();
    let testProcess = generatePeProcess(CptPeAddLatencyDescription);
    let testEnv = genTestEnvironment()
    let pe: CptPeAddLatency;

    before("setting up chai", () => {
        chai.should();
    });

    beforeEach("", () => {
        pe = new CptPeAddLatency(testProcess, testParent);
        pe.init(testEnv);
    });

    it("should instantiate fine", () => {
        pe.should.be.instanceof(CptPeAddLatency);
    });

    it("should init", () => {
        pe.init(testEnv).should.equal(true);
    });

    it("should forward response", () => {
        pe.process();
        pe.acceptResponse(makeLatencyResponse(100), pe.OUTPORT_ID);
        pe.processResponse();
        let response = pe.yieldResponse(pe.INPORT_LOAD_ID);
        expect(response).to.not.equal(null);
        response.should.have.property("type");
        response.type.should.equal("RESPONSE_NUMBER");
        response.value.should.equal(100);
    });

    it("should generate response", () => {
        pe.acceptLoad(makeNum(100), pe.INPORT_MEAN_ID);
        pe.process();
        pe.processResponse();
        let response = pe.yieldResponse(pe.INPORT_LOAD_ID);
        expect(response).to.not.equal(null);
        response.should.have.property("type");
        response.type.should.equal("RESPONSE_NUMBER");
        response.value.should.equal(100);
    });

    it("should generate random response", () => {
        pe.acceptLoad(makeNum(100), pe.INPORT_MEAN_ID);
        pe.acceptLoad(makeNum(10), pe.INPORT_STDDEV_ID);
        pe.process();
        pe.processResponse();
        let response = pe.yieldResponse(pe.INPORT_LOAD_ID);
        expect(response).to.not.equal(null);
        response.should.have.property("type");
        response.type.should.equal("RESPONSE_NUMBER");
        response.value.should.be.above(70);
        response.value.should.be.below(150);
    });

    it("should add generated and received response", () => {
        pe.acceptLoad(makeNum(100), pe.INPORT_MEAN_ID);
        pe.process();
        pe.acceptResponse(makeLatencyResponse(100), pe.OUTPORT_ID);
        pe.processResponse();
        let response = pe.yieldResponse(pe.INPORT_LOAD_ID);
        expect(response).to.not.equal(null);
        response.should.have.property("type");
        response.type.should.equal("RESPONSE_NUMBER");
        response.value.should.equal(200);
    });


});
