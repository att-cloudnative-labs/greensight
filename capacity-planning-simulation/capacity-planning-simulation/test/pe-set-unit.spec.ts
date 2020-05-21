import * as chai from 'chai';
import { describe, beforeEach, it } from 'mocha';
import { expect } from 'chai';
import { CptPeSetUnit, CptPeSetUnitDescription } from '../src/processing-elements/cpt-pe-set-unit';
import { NumberParam } from '@cpt/capacity-planning-simulation-types';
import { genTestParent, generatePeProcess, genTestEnvironment, makeNum } from './test-util';


describe("Processing Element: Set Unit", () => {
    let testParent = genTestParent();
    let testProcess = generatePeProcess(CptPeSetUnitDescription);
    let testEnv = genTestEnvironment()
    let pe: CptPeSetUnit;

    before("setting up chai", () => {
        chai.should();
    });

    beforeEach("", () => {
        pe = new CptPeSetUnit(testProcess, testParent);
        pe.init(testEnv);
    });

    it("should instantiate fine", () => {
        pe.should.be.instanceof(CptPeSetUnit);
    });

    it("should init", () => {
        pe.init(testEnv).should.equal(true);
    });

    it("should return unaltered load when no unit is set", () => {
        pe.acceptLoad(makeNum(1, "bananas"), pe.INPORT_LOAD_ID);
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        result.should.have.property("type");
        result.type.should.equal("NUMBER");
        result.value.should.equal(1);
        let numResult = result as NumberParam;
        numResult.unit.should.equal("bananas");
    });

    it("should return load whith new unit if unit is set", () => {
        pe.acceptLoad(makeNum(1, "bananas"), pe.INPORT_LOAD_ID);
        pe.acceptLoad({ type: 'STRING', value: 'apples' }, pe.INPORT_UNIT_ID);
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        result.should.have.property("type");
        result.type.should.equal("NUMBER");
        result.value.should.equal(1);
        let numResult = result as NumberParam;
        numResult.unit.should.equal("apples");
    });

    it("should return nothing with just the unit set", () => {
        pe.acceptLoad({ type: 'STRING', value: 'apples' }, pe.INPORT_UNIT_ID);
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        expect(result).to.equal(null);
    });
});
