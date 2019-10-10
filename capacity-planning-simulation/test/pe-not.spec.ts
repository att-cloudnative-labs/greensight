import * as chai from 'chai';
import { describe, beforeEach, it } from 'mocha';
import { expect } from 'chai';

import { genTestParent, generatePeProcess, genTestEnvironment, makeBool } from './test-util';
import { CptPeNotDescription, CptPeNot } from '../src/processing-elements/cpt-pe-not';


describe("Processing Element: Not", () => {
    let testParent = genTestParent();
    let testProcess = generatePeProcess(CptPeNotDescription);
    let testEnv = genTestEnvironment()
    let pe: CptPeNot;

    before("setting up chai", () => {
        chai.should();
    });

    beforeEach("", () => {
        pe = new CptPeNot(testProcess, testParent);
        pe.init(testEnv);
    });

    it("should instantiate fine", () => {
        pe.should.be.instanceof(CptPeNot);
    });

    it("should init", () => {
        pe.init(testEnv).should.equal(true);
    });

    it("should return false if load value is true", () => {
        pe.acceptLoad(makeBool(true), pe.INPORT_ID);
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        result.should.have.property("type");
        result.type.should.equal("BOOLEAN");
        result.value.should.equal(false);
    });

    it("should return true if load value is false", () => {
        pe.acceptLoad(makeBool(false), pe.INPORT_ID);
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        result.should.have.property("type");
        result.type.should.equal("BOOLEAN");
        result.value.should.equal(true);
    });

    it("return nothing without input", () => {
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        expect(result).to.equal(null);
    });
});