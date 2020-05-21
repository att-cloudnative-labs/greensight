import * as chai from 'chai';
import { expect, should } from 'chai';
import { describe, beforeEach, it } from 'mocha';
import { genTestParent, generatePeProcess, genTestEnvironment, makeNum, makeAspectNumber, setProcessPortConfiguration } from "./test-util";
import { CptPeMultiplyDescription, CptPeMultiply } from "../src/processing-elements/cpt-pe-mult";
import { isNumber } from "../src/cpt-load-ops";
import { Aspect, NumberParam } from '@cpt/capacity-planning-simulation-types';

describe("Processing Element: Multiply", () => {
    let testParent = genTestParent();
    let testProcess = generatePeProcess(CptPeMultiplyDescription);
    let testEnv = genTestEnvironment()
    let pe: CptPeMultiply;
    let aspect: Aspect = {
        name: 'devices',
        slices: { 'android': 40, 'ios': 60 }
    }

    before("setting up chai", () => {
        chai.should();
    });

    beforeEach("", () => {
        pe = new CptPeMultiply(testProcess, testParent);
        pe.init(testEnv);
    });

    it("should instantiate fine", () => {
        pe.should.be.instanceof(CptPeMultiply);
    });

    it("should init", () => {
        pe.init(testEnv).should.equal(true);
    });

    it("should multiply", () => {
        pe.acceptLoad(makeNum(2), pe.INPORT_A_ID);
        pe.acceptLoad(makeNum(3), pe.INPORT_B_ID);
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        result.should.have.property("type");
        result.type.should.equal("NUMBER");
        result.value.should.equal(6);
    });

    it("should return breakdowns applied to first param", () => {
        pe.acceptLoad(makeAspectNumber(10, aspect), pe.INPORT_A_ID);
        pe.acceptLoad(makeNum(2), pe.INPORT_B_ID);
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        result.should.have.property("type");
        result.type.should.equal("NUMBER");
        result.value.should.equal(20);
        let asn = result as NumberParam;
        asn.aspects.length.should.equal(1);
    });

    it("should drop breakdowns applied to second param", () => {
        pe.acceptLoad(makeNum(2), pe.INPORT_A_ID);
        pe.acceptLoad(makeAspectNumber(10, aspect), pe.INPORT_B_ID);
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        result.should.have.property("type");
        result.type.should.equal("NUMBER");
        result.should.not.have.property("aspects");
    });

    it("should have not unit on custom unit outport without config", () => {
        pe.acceptLoad(makeNum(2, "cm"), pe.INPORT_A_ID);
        pe.acceptLoad(makeNum(2, "cm"), pe.INPORT_B_ID);
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_CUSTOM_UNIT_ID);
        result.should.have.property("type");
        result.type.should.equal("NUMBER");
        if (isNumber(result)) {
            expect(result.unit).to.equal(undefined);
        }
    });

    it("should have a unit on custom unit outport with config", () => {
        let testInchProcess = generatePeProcess(CptPeMultiplyDescription);
        setProcessPortConfiguration(testInchProcess, pe.OUTPORT_CUSTOM_UNIT_ID, { type: 'STRING', value: 'inch' });
        let inchPe = new CptPeMultiply(testInchProcess, testParent);
        inchPe.init(testEnv);
        inchPe.acceptLoad(makeNum(2, "cm"), inchPe.INPORT_A_ID);
        inchPe.acceptLoad(makeNum(2, "cm"), inchPe.INPORT_B_ID);
        inchPe.process();
        let result = inchPe.yieldLoad(inchPe.OUTPORT_CUSTOM_UNIT_ID);
        result.should.have.property("type");
        result.type.should.equal("NUMBER");
        if (isNumber(result)) {
            expect(result.unit).to.equal('inch');
        }
    });

    it("should have a unit on outport", () => {
        pe.acceptLoad(makeNum(2, "cm"), pe.INPORT_A_ID);
        pe.acceptLoad(makeNum(2, "cm"), pe.INPORT_B_ID);
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        result.should.have.property("type");
        result.type.should.equal("NUMBER");
        if (isNumber(result)) {
            expect(result.unit).to.equal("cm");
        }
    });

});
