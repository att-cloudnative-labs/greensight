import * as chai from 'chai';
import { describe, beforeEach, it } from 'mocha';
import { expect } from 'chai';
import { CptPeRemoveUnit, CptPeRemoveUnitDescription } from '../src/processing-elements/cpt-pe-remove-unit';
import { NumberParam } from '@cpt/capacity-planning-simulation-types';
import { genTestParent, generatePeProcess, genTestEnvironment, makeNum } from './test-util';


describe("Processing Element: Remove Unit", () => {
    let testParent = genTestParent();
    let testProcess = generatePeProcess(CptPeRemoveUnitDescription);
    let testEnv = genTestEnvironment()
    let pe: CptPeRemoveUnit;

    before("setting up chai", () => {
        chai.should();
    });

    beforeEach("", () => {
        pe = new CptPeRemoveUnit(testProcess, testParent);
        pe.init(testEnv);
    });

    it("should instantiate fine", () => {
        pe.should.be.instanceof(CptPeRemoveUnit);
    });

    it("should init", () => {
        pe.init(testEnv).should.equal(true);
    });

    it("should return load without unit when a unit is set", () => {
        pe.acceptLoad(makeNum(1, "bananas"), pe.INPORT_ID);
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        result.should.have.property("type");
        result.type.should.equal("NUMBER");
        result.value.should.equal(1);
        let numResult = result as NumberParam;
        expect(numResult.unit).to.equal(undefined);
    });

    it("should return load without unit when no unit is set", () => {
        pe.acceptLoad(makeNum(1), pe.INPORT_ID);
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        result.should.have.property("type");
        result.type.should.equal("NUMBER");
        result.value.should.equal(1);
        let numResult = result as NumberParam;
        expect(numResult.unit).to.equal(undefined);
    });

    it("return nothing without input", () => {
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        expect(result).to.equal(null);
    });
});
