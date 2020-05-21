import * as chai from 'chai';
import { describe, beforeEach, it } from 'mocha';
import { CptPeTestSameUnit, CptPeTestSameUnitDescription } from '../src/processing-elements/cpt-pe-test-same-unit';
import { genTestParent, generatePeProcess, genTestEnvironment, makeNum } from './test-util';


describe("Processing Element: Test Same Unit", () => {
    let testParent = genTestParent();
    let testProcess = generatePeProcess(CptPeTestSameUnitDescription);
    let testEnv = genTestEnvironment()
    let pe: CptPeTestSameUnit;

    before("setting up chai", () => {
        chai.should();
    });

    beforeEach("", () => {
        pe = new CptPeTestSameUnit(testProcess, testParent);
        pe.init(testEnv);
    });

    it("should instantiate fine", () => {
        pe.should.be.instanceof(CptPeTestSameUnit);
    });

    it("should init", () => {
        pe.init(testEnv).should.equal(true);
    });

    it("should return true if the same unit on the static ports", () => {
        pe.acceptLoad(makeNum(1, "bananas"), pe.INPORT_A_ID);
        pe.acceptLoad(makeNum(1, "bananas"), pe.INPORT_B_ID);
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        result.should.have.property("type");
        result.type.should.equal("BOOLEAN");
        result.value.should.equal(true);
    });

    it("should return false if different units on the static ports", () => {
        pe.acceptLoad(makeNum(1, "apples"), pe.INPORT_A_ID);
        pe.acceptLoad(makeNum(1, "bananas"), pe.INPORT_B_ID);
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        result.should.have.property("type");
        result.type.should.equal("BOOLEAN");
        result.value.should.equal(false);
    });
});
