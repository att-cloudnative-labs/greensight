import * as chai from 'chai';
import { describe, beforeEach, it } from 'mocha';
import { genTestParent, generatePeProcess, genTestEnvironment, makeNum, makeAspectNumber, makeDistNum, assertAspect } from "./test-util";
import { Aspect, AspectNumberParam } from '../types/src/index';
import { CptPeMaxWeightedDescription, CptPeMaxWeighted } from '../src/processing-elements/cpt-pe-max-weighted';

describe("Processing Element: Max Weighted", () => {
    let testParent = genTestParent();
    let testProcess = generatePeProcess(CptPeMaxWeightedDescription);
    let testEnv = genTestEnvironment()
    let pe: CptPeMaxWeighted;
    let basicAspect: Aspect = {
        type: 'BREAKDOWN',
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

    it("should return standard deviation and unit of param with max value", () => {
        pe.acceptLoad(makeAspectNumber(50, basicAspect, 'tps', 20), pe.INPORT_A_ID);
        pe.acceptLoad(makeDistNum(10, 40, 'tph'), pe.INPORT_B_ID);
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        result.should.have.property("type");
        result.type.should.equal("ASPECT_NUMBER");
        result.value.should.equal(50);
        let asn = result as AspectNumberParam;
        asn.aspects.length.should.equal(1);
        asn.stdDev.should.equal(20);
        asn.unit.should.equal('tps');
    });

    it("should aggreagate breakdowns of all inputs", () => {
        pe.acceptLoad(makeAspectNumber(50, basicAspect, 'tps', 20), pe.INPORT_A_ID);
        pe.acceptLoad(makeAspectNumber(100, basicAspect, 'tps', 20), pe.INPORT_B_ID);
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        result.should.have.property("type");
        result.type.should.equal("ASPECT_NUMBER");
        result.value.should.equal(100);
        let asn = result as AspectNumberParam;
        asn.aspects.length.should.equal(1);
        let aspect = asn.aspects[0]
        assertAspect(aspect, { 'android': 160, 'ios': 40 });
    });
});