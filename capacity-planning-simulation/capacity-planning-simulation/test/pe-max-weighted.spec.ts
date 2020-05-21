import * as chai from 'chai';
import { describe, beforeEach, it } from 'mocha';
import { genTestParent, generatePeProcess, genTestEnvironment, makeNum, makeAspectNumber } from "./test-util";
import { Aspect, NumberParam } from '@cpt/capacity-planning-simulation-types';
import { CptPeMaxWeightedDescription, CptPeMaxWeighted } from '../src/processing-elements/cpt-pe-max-weighted';

describe("Processing Element: Max Weighted", () => {
    let testParent = genTestParent();
    let testProcess = generatePeProcess(CptPeMaxWeightedDescription);
    let testEnv = genTestEnvironment()
    let pe: CptPeMaxWeighted;
    let basicAspect: Aspect = {
        name: 'platform',
        slices: { 'android': 80, 'ios': 20 }
    }

    before("setting up chai", () => {
        chai.should();
    });

    beforeEach("", () => {
        pe = new CptPeMaxWeighted(testProcess, testParent);
        pe.init(testEnv);
    });

    it("should instantiate fine", () => {
        pe.should.be.instanceof(CptPeMaxWeighted);
    });

    it("should init", () => {
        pe.init(testEnv).should.equal(true);
    });

    it("should return maximum value", () => {
        pe.acceptLoad(makeNum(20), pe.INPORT_A_ID);
        pe.acceptLoad(makeNum(1), pe.INPORT_B_ID);
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        result.should.have.property("type");
        result.type.should.equal("NUMBER");
        result.value.should.equal(20);
    });

    it("should return value and unit of param with max value with mixed input types", () => {
        pe.acceptLoad(makeAspectNumber(50, basicAspect, 'tps'), pe.INPORT_A_ID);
        pe.acceptLoad(makeNum(10, 'tph'), pe.INPORT_B_ID);
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        result.should.have.property("type");
        result.type.should.equal("NUMBER");
        result.value.should.equal(50);
        let asn = result as NumberParam;
        asn.aspects.length.should.equal(1);
        asn.unit.should.equal('tps');
    });

    it("should aggregate breakdowns of all inputs", () => {
        pe.acceptLoad(makeAspectNumber(50, basicAspect, 'tps'), pe.INPORT_A_ID);
        pe.acceptLoad(makeAspectNumber(100, basicAspect, 'tps'), pe.INPORT_B_ID);
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        result.should.have.property("type");
        result.type.should.equal("NUMBER");
        result.value.should.equal(100);
        let asn = result as NumberParam;
        asn.aspects.length.should.equal(1);
        let aspect = asn.aspects[0]
        // FIXME: refactor impl
        // assertAspect(aspect, { 'android': 160, 'ios': 40 });
    });
});
