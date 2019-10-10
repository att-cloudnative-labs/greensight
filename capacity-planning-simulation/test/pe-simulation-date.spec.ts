import * as chai from 'chai';
import { describe, beforeEach, it } from 'mocha';
import { genTestParent, generatePeProcess, genTestEnvironment, makeNum, makeAspectNumber } from "./test-util";
import { CptPeSimulationDateDescription, CptPeSimulationDate } from '../src/processing-elements/cpt-pe-simulation-date';
import { AspectNumberParam, Aspect } from '../types/src/index';

describe("Processing Element: Simulation Date", () => {
    let testParent = genTestParent();
    let testProcess = generatePeProcess(CptPeSimulationDateDescription);
    let testEnv = genTestEnvironment()
    let pe: CptPeSimulationDate;


    before("setting up chai", () => {
        chai.should();
    });

    beforeEach("", () => {
        pe = new CptPeSimulationDate(testProcess, testParent);
        pe.init(testEnv);
    });

    it("should instantiate fine", () => {
        pe.should.be.instanceof(CptPeSimulationDate);
    });

    it("should init", () => {
        pe.init(testEnv).should.equal(true);
    });

    it("should return test year", () => {
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_YEAR_ID);
        result.should.have.property("type");
        result.type.should.equal("NUMBER");
        result.value.should.equal(2019);
    });

    it("should return test month", () => {
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_MONTH_ID);
        result.should.have.property("type");
        result.type.should.equal("NUMBER");
        result.value.should.equal(4);
    });
});
