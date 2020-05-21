import * as chai from 'chai';
import { describe, beforeEach, it } from 'mocha';
import { expect, } from 'chai';
import { CptPeParallelExecution, CptPeParallelExecutionDescription } from '../src/processing-elements/cpt-pe-parallelexecution'
import {
    genTestParent,
    generatePeProcess,
    genTestEnvironment,
    makeNum,
    makeResponseEnvironment, assertSplit, assertLatencyResponseNumber
} from './test-util';
import { makeLatencyResponse } from '../src/cpt-response-ops';


describe("Processing Element: Parallel Execution", () => {
    let testParent = genTestParent();
    let testProcess = generatePeProcess(CptPeParallelExecutionDescription);
    let testEnv = genTestEnvironment();
    const responseEnv = makeResponseEnvironment();

    let pe: CptPeParallelExecution;

    before("setting up chai", () => {
        chai.should();
    });

    beforeEach("", () => {
        pe = new CptPeParallelExecution(testProcess, testParent);
        pe.init(testEnv);
    });

    it("should instantiate fine", () => {
        pe.should.be.instanceof(CptPeParallelExecution);
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
        const response = pe.yieldResponse(pe.INPORT_LOAD_ID);
        const respNum = assertLatencyResponseNumber(response);
        assertSplit(100, respNum.value);
    });

    it("should forward a single response from port B", () => {
        pe.process();
        pe.acceptResponse(makeLatencyResponse(100), pe.OUTPORT_B_ID);
        pe.processResponse();
        const response = pe.yieldResponse(pe.INPORT_LOAD_ID);
        const respNum = assertLatencyResponseNumber(response);
        assertSplit(100, respNum.value);
    });

    it("select max responses from A & B", () => {
        pe.process();
        pe.acceptResponse(makeLatencyResponse(200), pe.OUTPORT_A_ID);
        pe.acceptResponse(makeLatencyResponse(100), pe.OUTPORT_B_ID);
        pe.processResponse();
        const response = pe.yieldResponse(pe.INPORT_LOAD_ID);
        const respNum = assertLatencyResponseNumber(response);
        assertSplit(200, respNum.value);
    });

    it("select max responses from A & B with aspects", () => {
        pe.process();
        pe.acceptResponse(responseEnv.seasonsAggregate, pe.OUTPORT_A_ID);
        pe.acceptResponse(responseEnv.leapYearAggregate, pe.OUTPORT_B_ID);
        pe.processResponse();
        let response = pe.yieldResponse(pe.INPORT_LOAD_ID);
        const respNumber = assertLatencyResponseNumber(response);

        assertSplit(respNumber.value, responseEnv.parallelAggregate.value)
    });
});
