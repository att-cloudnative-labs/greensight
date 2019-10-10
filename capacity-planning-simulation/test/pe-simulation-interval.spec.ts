import * as chai from 'chai';
import { describe, beforeEach, it } from 'mocha';
import { genTestParent, generatePeProcess, genTestEnvironment, makeNum, makeAspectNumber } from "./test-util";
import { CptPeSimulationIntervalDescription, CptPeSimulationInterval } from '../src/processing-elements/cpt-pe-simulation-interval';
import { AspectNumberParam, Aspect } from '../types/src/index';

describe("Processing Element: Simulation Date", () => {
    let testParent = genTestParent();
    let testProcess = generatePeProcess(CptPeSimulationIntervalDescription);
    let testEnv = genTestEnvironment()
    let pe: CptPeSimulationInterval;


    before("setting up chai", () => {
        chai.should();
    });

    beforeEach("", () => {
        pe = new CptPeSimulationInterval(testProcess, testParent);
        pe.init(testEnv);
    });

    it("should instantiate fine", () => {
        pe.should.be.instanceof(CptPeSimulationInterval);
    });

    it("should init", () => {
        pe.init(testEnv).should.equal(true);
    });

    it("should return seconds", () => {
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_SECONDS_ID);
        result.should.have.property("type");
        result.type.should.equal("NUMBER");
        result.value.should.equal(2592000);
    });

    it("should return minutes", () => {
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_MINUTES_ID);
        result.should.have.property("type");
        result.type.should.equal("NUMBER");
        result.value.should.equal(43200);
    });

    it("should return hours", () => {
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_HOURS_ID);
        result.should.have.property("type");
        result.type.should.equal("NUMBER");
        result.value.should.equal(720);
    });

    it("should return days", () => {
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_DAYS_ID);
        result.should.have.property("type");
        result.type.should.equal("NUMBER");
        result.value.should.equal(30);
    });
});
