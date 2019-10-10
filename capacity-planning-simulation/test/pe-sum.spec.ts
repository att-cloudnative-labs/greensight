import * as chai from 'chai';
import { describe, beforeEach, it } from 'mocha';
import { expect, should } from 'chai';

import { getPeRepository, CptProcessingElement, CptSimulationProcessIf, buildProcessingElement } from '../src/index';
import { CptPeSum, CptPeSumDescription } from '../src/processing-elements/cpt-pe-sum';
import { Inport, Outport, ProcessInterfaceDescription, ProcessPortTemplate, Process, NumberParam } from '../types/src/index';
import { genTestParent, generatePeProcess, genTestEnvironment, makeNum, addTemplate } from './test-util';


describe("Processing Element: Sum", () => {
    let testParent = genTestParent();
    let testProcess = generatePeProcess(CptPeSumDescription);

    let testEnv = genTestEnvironment()
    let pe: CptPeSum;

    before("setting up chai", () => {
        chai.should();
    });

    beforeEach("", () => {
        pe = new CptPeSum(testProcess, testParent);
        pe.init(testEnv);
    });

    it("should instantiate fine", () => {
        pe.should.be.instanceof(CptPeSum);
    });

    it("should init", () => {
        pe.init(testEnv).should.equal(true);
    });

    it("should add", () => {
        pe.acceptLoad(makeNum(1), pe.INPORT_A_ID);
        pe.acceptLoad(makeNum(1), pe.INPORT_B_ID);
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        expect(result).to.not.equal(null);
        result.should.have.property("type");
        result.type.should.equal("NUMBER");
        result.value.should.equal(2);
    });

    it("sum should have unit of port a", () => {
        pe.acceptLoad(makeNum(1, 'euro'), pe.INPORT_A_ID);
        pe.acceptLoad(makeNum(1, 'dollar'), pe.INPORT_B_ID);
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        expect(result).to.not.equal(null);
        result.should.have.property("type");
        result.type.should.equal("NUMBER");
        let numResult = result as NumberParam;
        numResult.value.should.equal(2);
        expect(numResult.unit).to.equal('euro');
    });

    it("should add with template port", () => {
        let templatePeProcess = generatePeProcess(CptPeSumDescription);
        let tmplPortId = addTemplate(templatePeProcess, CptPeSumDescription.portTemplates[pe.TMPL_SUMMAND_ID]);
        let tmplPe = new CptPeSum(templatePeProcess, testParent);
        tmplPe.init(testEnv);
        tmplPe.acceptLoad(makeNum(1), tmplPe.INPORT_A_ID);
        tmplPe.acceptLoad(makeNum(1), tmplPe.INPORT_B_ID);
        tmplPe.acceptLoad(makeNum(1), tmplPortId);
        tmplPe.process();
        let result = tmplPe.yieldLoad(tmplPe.OUTPORT_ID);
        expect(result).to.not.equal(null);
        result.should.have.property("type");
        result.type.should.equal("NUMBER");
        result.value.should.equal(3);
    });

});
