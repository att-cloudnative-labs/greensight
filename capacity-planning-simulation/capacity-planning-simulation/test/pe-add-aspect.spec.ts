import * as chai from 'chai';
import { describe, beforeEach, it } from 'mocha';

import { CptPeAddAspect, CptPeAddAspectDescription } from '../src/processing-elements/cpt-pe-addaspect';
import { AspectParam, NumberParam } from "@cpt/capacity-planning-simulation-types";

import { genTestParent, generatePeProcess, genTestEnvironment, makeNum } from './test-util';


describe("Processing Element: Add Aspect", () => {
    let testParent = genTestParent();
    let testProcess = generatePeProcess(CptPeAddAspectDescription);
    let testEnv = genTestEnvironment()
    let pe: CptPeAddAspect;

    let basicAspect: AspectParam = {
        type: 'ASPECT',
        value: {
            name: 'platform',
            slices: { 'android': 100, 'ios': 20 }
        }
    }

    before("setting up chai", () => {
        chai.should();
    });

    beforeEach("", () => {
        pe = new CptPeAddAspect(testProcess, testParent);
        pe.init(testEnv);
    });

    it("should instantiate fine", () => {
        pe.should.be.instanceof(CptPeAddAspect);
    });

    it("should init", () => {
        pe.init(testEnv).should.equal(true);
    });

    it("should add aspect to number", () => {
        pe.acceptLoad(makeNum(1), pe.INPORT_LOAD_ID);
        pe.acceptLoad(basicAspect, pe.INPORT_ASPECT_ID);
        pe.process();
        let result = pe.yieldLoad(pe.OUTPORT_ID);
        result.should.have.property("type");
        result.type.should.equal("NUMBER");
        result.value.should.equal(1);
        let asn = result as NumberParam;
        asn.aspects.length.should.equal(1);
        let aspect = asn.aspects[0];
        for (let sliceName in basicAspect.value.slices) {
            aspect.slices[sliceName].should.not.equal(undefined);
            // aspect.slices[sliceName].should.equal(basicAspect.value.slices[sliceName]);
        }
    });

});
