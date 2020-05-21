import * as chai from 'chai';
import { describe, beforeEach, it } from 'mocha';
import { expect, should } from 'chai';

import { CptPeAddLatency, CptPeAddLatencyDescription } from '../src/processing-elements/cpt-pe-addlatency'
import { getResponseValueMean, makeLatencyResponse } from '../src/cpt-response-ops';
import {
    genTestParent,
    generatePeProcess,
    genTestEnvironment,
    makeNum,
    makeResponseEnvironment, makeAspectNumber, assertSplit, assertLatencyResponseNumber,
} from './test-util';


describe("Processing Element: Add Latency", () => {
    let testParent = genTestParent();
    let testProcess = generatePeProcess(CptPeAddLatencyDescription);
    let testEnv = genTestEnvironment()
    const responseEnv = makeResponseEnvironment();
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
        const response = pe.yieldResponse(pe.INPORT_LOAD_ID);
        const respNum = assertLatencyResponseNumber(response);
        assertSplit([{ freq: 1000, value: 100 }], respNum.value);

    });

    it("should generate response", () => {
        pe.acceptLoad(makeNum(100), pe.INPORT_MEAN_ID);
        pe.process();
        pe.processResponse();
        const response = pe.yieldResponse(pe.INPORT_LOAD_ID);
        const respNum = assertLatencyResponseNumber(response);
        assertSplit([{ freq: 1000, value: 100 }], respNum.value);
    });

    it("should generate random response", () => {
        pe.acceptLoad(makeNum(100), pe.INPORT_MEAN_ID);
        pe.acceptLoad(makeNum(10), pe.INPORT_STDDEV_ID);
        pe.process();
        pe.processResponse();
        const response = pe.yieldResponse(pe.INPORT_LOAD_ID);
        const respNum = assertLatencyResponseNumber(response);
        const mean = getResponseValueMean(respNum.value);
        mean.should.be.above(70);
        mean.should.be.below(150);
    });

    it("should add generated and received response", () => {
        pe.acceptLoad(makeNum(100), pe.INPORT_MEAN_ID);
        pe.process();
        pe.acceptResponse(makeLatencyResponse(100), pe.OUTPORT_ID);
        pe.processResponse();
        const response = pe.yieldResponse(pe.INPORT_LOAD_ID);
        const respNum = assertLatencyResponseNumber(response);
        assertSplit([{ freq: 1000, value: 200 }], respNum.value);
    });

    it("should add response with aspects", () => {
        pe.acceptLoad(makeAspectNumber(10, responseEnv.aspectSeason), pe.INPORT_LOAD_ID);
        pe.acceptLoad(makeNum(100), pe.INPORT_MEAN_ID);
        pe.process();
        pe.processResponse();
        const response = pe.yieldResponse(pe.INPORT_LOAD_ID);
        const respNum = assertLatencyResponseNumber(response);
        assertSplit([{ freq: 1000, value: 100 }], respNum.value);
        respNum.aspects.length.should.equal(2);
        const seasonResponseAspect = respNum.aspects.find(a => a.name === responseEnv.aspectSeason.name);
        expect(seasonResponseAspect).to.not.equal(null);
        for (const season in seasonResponseAspect.slices) {
            const seasonSplit = seasonResponseAspect.slices[season];
            expect(seasonSplit).to.not.equal(null);
            assertSplit([{ value: 100, freq: 1000 }], seasonSplit);
        }
    });

    it("should merge response with aspects with downstream response", () => {
        const inLoad = makeAspectNumber(10, responseEnv.aspectSeason);
        pe.acceptLoad(inLoad, pe.INPORT_LOAD_ID);
        pe.acceptLoad(makeNum(100), pe.INPORT_MEAN_ID);
        pe.process();
        pe.acceptResponse(responseEnv.winterResponse, pe.OUTPORT_ID);
        pe.processResponse();
        let response = pe.yieldResponse(pe.INPORT_LOAD_ID);
        const respNum = assertLatencyResponseNumber(response);
        assertSplit([{ freq: 1000, value: 140 }], respNum.value);
        respNum.aspects.length.should.equal(3);
        const seasonResponseAspect = respNum.aspects.find(a => a.name === responseEnv.aspectSeason.name);
        expect(seasonResponseAspect).to.not.equal(null);
        for (const season in seasonResponseAspect.slices) {
            const seasonSplit = seasonResponseAspect.slices[season];
            expect(seasonSplit).to.not.equal(null);
            if (season === 'winter')
                assertSplit([{ value: 140, freq: 1000 }], seasonSplit);
            else
                assertSplit([{ value: 100, freq: 1000 }], seasonSplit);
        }
    });


});
